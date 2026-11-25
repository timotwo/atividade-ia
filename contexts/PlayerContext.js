import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import * as MediaLibrary from 'expo-media-library/legacy';
import MusicInfo from 'expo-music-info-2';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chaveMes } from '../Componentes/visual';

const DURACAO_MINIMA_SEGUNDOS = 53;
const PlayerContext = createContext(null);

function corrigirPictureData(pictureData) {
  if (!pictureData) return null;

  const match = pictureData.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/s);
  if (!match) return null;

  const mime = match[1];
  const base64 = match[2].replace(/\s/g, '');

  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);

  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }

  let inicio = -1;

  for (let i = 0; i < bytes.length - 3; i++) {
    if (
      bytes[i] === 0xff &&
      bytes[i + 1] === 0xd8 &&
      bytes[i + 2] === 0xff
    ) {
      inicio = i;
      break;
    }

    if (
      bytes[i] === 0x89 &&
      bytes[i + 1] === 0x50 &&
      bytes[i + 2] === 0x4e &&
      bytes[i + 3] === 0x47
    ) {
      inicio = i;
      break;
    }
  }

  if (inicio === -1) return null;

  const bytesImagem = bytes.slice(inicio);

  let binarioImagem = '';

  for (let i = 0; i < bytesImagem.length; i++) {
    binarioImagem += String.fromCharCode(bytesImagem[i]);
  }

  return `data:${mime};base64,${btoa(binarioImagem)}`;
}

export function PlayerProvider({ children }) {
  const [musicas, setMusicas] = useState([]);
  const [filaAtual, setFilaAtual] = useState([]);
  const [indiceNaFila, setIndiceNaFila] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [capaAtual, setCapaAtual] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [stats, setStats] = useState({});
  const [capasCache, setCapasCache] = useState({});
  const capasPedidasRef = useRef(new Set());
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const jaAvancou = useRef(false);

  // estatísticas
  const statsRef = useRef({});
  const pendenteRef = useRef({ id: null, nome: '', segundos: 0 });
  const ultimoTempoRef = useRef(null);

  // quantas músicas "tocar a seguir" estão logo depois da atual
  const qtdManualRef = useRef(0);

  const musicaAtual = indiceNaFila !== null
    ? musicas.find((m) => m.id === filaAtual[indiceNaFila]) ?? null
    : null;

  function estaTocando(musicaId) {
    return musicaAtual?.id === musicaId;
  }

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  }, []);

  useEffect(() => {
    carregarMusicas();
  }, []);

  useEffect(() => {
    carregarPlaylists();
  }, []);

  useEffect(() => {
    carregarStats();
  }, []);

  // avanço automático ao terminar
  useEffect(() => {
    if (!musicaAtual || !status.duration) return;

    const terminou =
      status.currentTime > 0 &&
      status.currentTime >= status.duration - 0.3;

    if (terminou && !jaAvancou.current) {
      jaAvancou.current = true;
      proximaMusica();
    }

    if (!terminou) {
      jaAvancou.current = false;
    }
  }, [status.currentTime, status.duration]);

  // acumula tempo ouvido enquanto toca
  useEffect(() => {
    const p = pendenteRef.current;
    if (!p.id) return;

    const t = status.currentTime;
    const ultimo = ultimoTempoRef.current;
    ultimoTempoRef.current = t;

    if (!status.playing || ultimo === null) return;

    const delta = t - ultimo;
    if (delta > 0 && delta < 3) {
      p.segundos += delta;
      if (p.segundos >= 10) flushPendente();
    }
  }, [status.currentTime]);

  // ao pausar, grava o que estava pendente
  useEffect(() => {
    if (!status.playing) {
      flushPendente();
      ultimoTempoRef.current = null;
    }
  }, [status.playing]);

  // ---------- estatísticas ----------

  async function carregarStats() {
    try {
      const salvas = await AsyncStorage.getItem('@stats');

      if (salvas) {
        const obj = JSON.parse(salvas);
        statsRef.current = obj;
        setStats(obj);
      }
    } catch (e) {}
  }

  function registrarStats(musica, plays, segundos) {
    if (!musica?.id) return;

    const mes = chaveMes();
    const atual = statsRef.current[musica.id] ?? {
      nome: musica.nome,
      plays: 0,
      segundos: 0,
      mensal: {},
    };
    const doMes = atual.mensal?.[mes] ?? { plays: 0, segundos: 0 };

    const novo = {
      ...statsRef.current,
      [musica.id]: {
        ...atual,
        nome: musica.nome,
        plays: atual.plays + plays,
        segundos: atual.segundos + segundos,
        mensal: {
          ...atual.mensal,
          [mes]: {
            plays: doMes.plays + plays,
            segundos: doMes.segundos + segundos,
          },
        },
      },
    };

    statsRef.current = novo;
    setStats(novo);

    AsyncStorage.setItem('@stats', JSON.stringify(novo)).catch(() => {});
  }

  function flushPendente() {
    const p = pendenteRef.current;

    if (p.id && p.segundos > 0) {
      registrarStats({ id: p.id, nome: p.nome }, 0, p.segundos);
    }

    p.segundos = 0;
  }

  // ---------- músicas ----------

  async function carregarMusicas() {
    setCarregando(true);

    let permissao = permissionResponse;

    if (!permissao?.granted) {
      permissao = await requestPermission();
    }

    if (!permissao.granted) {
      setCarregando(false);
      return;
    }

    let todasAsMusicas = [];

    let pagina = await MediaLibrary.getAssetsAsync({
      mediaType: 'audio',
      first: 200,
    });

    todasAsMusicas = [...pagina.assets];

    while (pagina.hasNextPage) {
      pagina = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 200,
        after: pagina.endCursor,
      });

      todasAsMusicas = [...todasAsMusicas, ...pagina.assets];
    }

    const formatadas = todasAsMusicas
      .filter((item) => (item.duration ?? 0) >= DURACAO_MINIMA_SEGUNDOS)
      .map((item) => ({
        id: item.id,
        nome: item.filename.replace(/\.(mp3)$/i, ''),
        uri: item.uri,
        duracao: item.duration ?? 0,
      }))
      .sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR', {
          sensitivity: 'base',
        })
      );

    setMusicas(formatadas);
    setCarregando(false);
  }

  async function carregarPlaylists() {
    try {
      const salvas = await AsyncStorage.getItem('@playlists');

      if (salvas) {
        setPlaylists(JSON.parse(salvas));
      }
    } catch (e) {}
  }

  async function salvarPlaylists(novasPlaylists) {
    setPlaylists(novasPlaylists);

    try {
      await AsyncStorage.setItem(
        '@playlists',
        JSON.stringify(novasPlaylists)
      );
    } catch (e) {}
  }

  function criarPlaylist(nome) {
    if (!nome.trim()) return;

    salvarPlaylists([
      ...playlists,
      {
        id: Date.now().toString(),
        nome: nome.trim(),
        musicas: [],
      },
    ]);
  }

  function excluirPlaylist(playlistId) {
    salvarPlaylists(
      playlists.filter((p) => p.id !== playlistId)
    );
  }

  function adicionarMusicasNaPlaylist(playlistId, idsMusicas) {
    salvarPlaylists(
      playlists.map((p) => {
        if (p.id !== playlistId) return p;

        return {
          ...p,
          musicas: [
            ...p.musicas,
            ...idsMusicas.filter(
              (id) => !p.musicas.includes(id)
            ),
          ],
        };
      })
    );
  }

  function removerMusicaDaPlaylist(playlistId, musicaId) {
    salvarPlaylists(
      playlists.map((p) => {
        if (p.id !== playlistId) return p;

        return {
          ...p,
          musicas: p.musicas.filter(
            (id) => id !== musicaId
          ),
          capaMusicaId:
            p.capaMusicaId === musicaId ? null : p.capaMusicaId ?? null,
        };
      })
    );
  }

  async function lerCapa(item) {
    try {
      const info = await MediaLibrary.getAssetInfoAsync(item.id);

      const uriParaLeitura =
        info.localUri ||
        info.uri ||
        item.uri;

      const metadata = await MusicInfo.getMusicInfoAsync(
        uriParaLeitura,
        { picture: true }
      );

      return corrigirPictureData(
        metadata?.picture?.pictureData
      );
    } catch (e) {
      return null;
    }
  }

  async function buscarCapa(item) {
    setCapaAtual(await lerCapa(item));
  }

  // carrega (uma única vez) a capa de qualquer música, para usar nas playlists
  async function garantirCapa(musicaId) {
    if (capasPedidasRef.current.has(musicaId)) return;

    const musica = musicas.find((m) => m.id === musicaId);
    if (!musica) return;

    capasPedidasRef.current.add(musicaId);

    const uri = await lerCapa(musica);

    setCapasCache((anterior) => ({ ...anterior, [musicaId]: uri }));
  }

  // define qual música fornece a capa da playlist (null = sem capa)
  function definirCapaPlaylist(playlistId, musicaId) {
    salvarPlaylists(
      playlists.map((p) =>
        p.id === playlistId ? { ...p, capaMusicaId: musicaId } : p
      )
    );
  }

  // ---------- reprodução ----------

  function tocarMusica(
    idMusica,
    fila = musicas.map((m) => m.id),
    indice
  ) {
    const musica = musicas.find(
      (m) => m.id === idMusica
    );

    if (!musica) return;

    // nova lista escolhida pelo usuário: zera a fila manual
    if (fila !== filaAtual) {
      qtdManualRef.current = 0;
    }

    const novoIndice = indice ?? fila.indexOf(idMusica);

    // fecha as estatísticas da música anterior e abre a nova
    flushPendente();
    pendenteRef.current = { id: musica.id, nome: musica.nome, segundos: 0 };
    ultimoTempoRef.current = null;
    registrarStats(musica, 1, 0);

    setFilaAtual(fila);
    setIndiceNaFila(novoIndice);
    setCapaAtual(null);

    player.replace({ uri: musica.uri });

    player.setActiveForLockScreen(true, {
      title: musica.nome,
      artist: 'MSC WOW',
    });

    player.play();

    buscarCapa(musica);
  }

  function alternarPlayPause(idMusica, fila) {
    if (musicaAtual?.id === idMusica) {
      status.playing
        ? player.pause()
        : player.play();
    } else {
      tocarMusica(idMusica, fila);
    }
  }

  function proximaMusica() {
    if (
      indiceNaFila === null ||
      filaAtual.length === 0
    ) {
      return;
    }

    const proximoIndice =
      (indiceNaFila + 1) % filaAtual.length;

    qtdManualRef.current = Math.max(0, qtdManualRef.current - 1);

    tocarMusica(
      filaAtual[proximoIndice],
      filaAtual,
      proximoIndice
    );
  }

  function musicaAnterior() {
    if (
      indiceNaFila === null ||
      filaAtual.length === 0
    ) {
      return;
    }

    const anteriorIndice =
      (indiceNaFila - 1 + filaAtual.length) %
      filaAtual.length;

    qtdManualRef.current = 0;

    tocarMusica(
      filaAtual[anteriorIndice],
      filaAtual,
      anteriorIndice
    );
  }

  // "Tocar a seguir": coloca a música logo depois da atual sem interromper
  // Retorna 'fila' (adicionada) ou 'tocando' (nada tocava, começou agora)
  function tocarProxima(idMusica) {
    if (!musicas.some((m) => m.id === idMusica)) return null;

    if (indiceNaFila === null || filaAtual.length === 0) {
      tocarMusica(idMusica);
      return 'tocando';
    }

    const posicao = indiceNaFila + 1 + qtdManualRef.current;

    setFilaAtual([
      ...filaAtual.slice(0, posicao),
      idMusica,
      ...filaAtual.slice(posicao),
    ]);

    qtdManualRef.current += 1;

    return 'fila';
  }

  return (
    <PlayerContext.Provider
      value={{
        musicas,
        musicaAtual,
        estaTocando,
        carregando,
        status,
        player,
        capaAtual,
        permissionResponse,
        carregarMusicas,
        tocarMusica,
        alternarPlayPause,
        proximaMusica,
        musicaAnterior,
        tocarProxima,
        stats,
        capasCache,
        garantirCapa,
        definirCapaPlaylist,
        playlists,
        criarPlaylist,
        excluirPlaylist,
        adicionarMusicasNaPlaylist,
        removerMusicaDaPlaylist,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);

  if (!ctx) {
    throw new Error('erro');
  }

  return ctx;
}
