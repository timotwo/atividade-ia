import { View, Text, Pressable, TextInput, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { CapaQuadrada } from './visual';

// miniatura que carrega a capa da música sob demanda
function MiniCapa({ musicaId, nome, tamanho = 52 }) {
  const { capasCache, garantirCapa, musicas } = usePlayer();
  const pronto = musicas.length > 0;

  useEffect(() => {
    if (musicaId && pronto) garantirCapa(musicaId);
  }, [musicaId, pronto]);

  return (
    <CapaQuadrada
      capa={musicaId ? capasCache[musicaId] : null}
      nome={nome}
      tamanho={tamanho}
    />
  );
}

export default function PlaylistPanel() {
  const {
    musicas,
    status,
    estaTocando,
    alternarPlayPause,
    tocarProxima,
    playlists,
    criarPlaylist,
    excluirPlaylist,
    adicionarMusicasNaPlaylist,
    removerMusicaDaPlaylist,
    definirCapaPlaylist,
  } = usePlayer();

  const [nome, setNome] = useState('');
  const [criando, setCriando] = useState(false);
  const [playlistSelecionadaId, setPlaylistSelecionadaId] = useState(null);
  const [adicionandoMusicas, setAdicionandoMusicas] = useState(false);
  const [escolhendoCapa, setEscolhendoCapa] = useState(false);
  const [musicasSelecionadas, setMusicasSelecionadas] = useState([]);
  const [pesquisa, setPesquisa] = useState('');

  const playlistSelecionada =
    playlists.find((p) => p.id === playlistSelecionadaId) ?? null;

  function handleCriarPlaylist() {
    criarPlaylist(nome);
    setNome('');
    setCriando(false);
  }

  function alternarMusica(id) {
    setMusicasSelecionadas((anteriores) =>
      anteriores.includes(id)
        ? anteriores.filter((musicaId) => musicaId !== id)
        : [...anteriores, id]
    );
  }

  function handleAdicionarMusicas() {
    adicionarMusicasNaPlaylist(
      playlistSelecionadaId,
      musicasSelecionadas
    );
    setMusicasSelecionadas([]);
    setAdicionandoMusicas(false);
    setPesquisa('');
  }

  function escolherCapa(musicaId) {
    definirCapaPlaylist(playlistSelecionada.id, musicaId);
    setEscolhendoCapa(false);
  }

  const musicasFiltradas = musicas.filter((musica) =>
    musica.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  // ---------- adicionar músicas ----------
  if (playlistSelecionada && adicionandoMusicas) {
    return (
      <View style={styles.container}>
        <Pressable
          style={styles.voltar}
          onPress={() => {
            setAdicionandoMusicas(false);
            setMusicasSelecionadas([]);
            setPesquisa('');
          }}
        >
          <View style={styles.voltarLinha}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.voltarTexto}>Voltar</Text>
          </View>
        </Pressable>

        <Text style={styles.titulo}>Adicionar musicas</Text>

        <TextInput
          style={styles.pesquisa}
          placeholder="Pesquisar música          👀"
          placeholderTextColor="#8fb7a8"
          value={pesquisa}
          onChangeText={setPesquisa}
        />

        <Pressable
          style={styles.botao}
          onPress={handleAdicionarMusicas}
        >
          <Text style={styles.botaoTexto}>
            Adicionar selecionadas
          </Text>
        </Pressable>

        <Text style={styles.subtitulo}>
          {musicasSelecionadas.length} selecionada(s)
        </Text>

        <FlatList
          data={musicasFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const selecionada =
              musicasSelecionadas.includes(item.id);

            return (
              <Pressable
                style={[
                  styles.musica,
                  selecionada && styles.musicaSelecionada,
                ]}
                onPress={() => alternarMusica(item.id)}
              >
                <Text
                  style={styles.nomeMusica}
                  numberOfLines={1}
                >
                  {item.nome}
                </Text>

                <Ionicons
                  name={selecionada ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={selecionada ? '#2bea81' : '#fff'}
                  style={{ marginLeft: 10 }}
                />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              Nenhuma música encontrada.
            </Text>
          }
        />
      </View>
    );
  }

  // ---------- escolher a capa da playlist ----------
  if (playlistSelecionada && escolhendoCapa) {
    const musicasDaPlaylist = musicas.filter((musica) =>
      playlistSelecionada.musicas.includes(musica.id)
    );

    return (
      <View style={styles.container}>
        <Pressable
          style={styles.voltar}
          onPress={() => setEscolhendoCapa(false)}
        >
          <View style={styles.voltarLinha}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.voltarTexto}>Voltar</Text>
          </View>
        </Pressable>

        <Text style={styles.titulo}>Capa da playlist</Text>
        <Text style={styles.subtitulo}>
          Escolha a música cuja capa vai representar a playlist.
        </Text>

        <Pressable
          style={[
            styles.musica,
            !playlistSelecionada.capaMusicaId && styles.musicaSelecionada,
          ]}
          onPress={() => escolherCapa(null)}
        >
          <CapaQuadrada capa={null} nome={playlistSelecionada.nome} tamanho={44} />
          <Text style={[styles.nomeMusica, { marginLeft: 12 }]} numberOfLines={1}>
            Sem capa (iniciais)
          </Text>
          {!playlistSelecionada.capaMusicaId && (
            <Ionicons name="checkmark-circle" size={24} color="#2bea81" />
          )}
        </Pressable>

        <FlatList
          data={musicasDaPlaylist}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const selecionada = playlistSelecionada.capaMusicaId === item.id;

            return (
              <Pressable
                style={[styles.musica, selecionada && styles.musicaSelecionada]}
                onPress={() => escolherCapa(item.id)}
              >
                <MiniCapa musicaId={item.id} nome={item.nome} tamanho={44} />

                <Text style={[styles.nomeMusica, { marginLeft: 12 }]} numberOfLines={1}>
                  {item.nome}
                </Text>

                {selecionada && (
                  <Ionicons name="checkmark-circle" size={24} color="#2bea81" />
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              Adicione músicas à playlist para escolher uma capa.
            </Text>
          }
        />
      </View>
    );
  }

  // ---------- dentro de uma playlist ----------
  if (playlistSelecionada) {
    const musicasDaPlaylist = musicas.filter((musica) =>
      playlistSelecionada.musicas.includes(musica.id)
    );

    const filaDaPlaylist = musicasDaPlaylist.map((m) => m.id);

    return (
      <View style={styles.container}>
        <Pressable
          style={styles.voltar}
          onPress={() => setPlaylistSelecionadaId(null)}
        >
          <View style={styles.voltarLinha}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.voltarTexto}>Voltar</Text>
          </View>
        </Pressable>

        <View style={styles.cabecalho}>
          <Pressable onPress={() => setEscolhendoCapa(true)}>
            <MiniCapa
              musicaId={playlistSelecionada.capaMusicaId}
              nome={playlistSelecionada.nome}
              tamanho={88}
            />
            <View style={styles.editarCapa}>
              <Ionicons name="image-outline" size={14} color="#fff" />
            </View>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={[styles.titulo, { marginBottom: 6 }]} numberOfLines={2}>
              {playlistSelecionada.nome}
            </Text>

            <Text style={styles.quantidade}>
              {playlistSelecionada.musicas.length} músicas
            </Text>
          </View>
        </View>

        <View style={styles.linhaBotoes}>
          <Pressable
            style={[styles.botao, styles.botaoMetade]}
            onPress={() => {
              setMusicasSelecionadas([]);
              setPesquisa('');
              setAdicionandoMusicas(true);
            }}
          >
            <Text style={styles.botaoTexto}>
              + Adicionar musicas
            </Text>
          </Pressable>

          <Pressable
            style={[styles.botao, styles.botaoMetade, styles.botaoSecundario]}
            onPress={() => setEscolhendoCapa(true)}
          >
            <Text style={styles.botaoTexto}>
              Escolher capa
            </Text>
          </Pressable>
        </View>

        {musicasDaPlaylist.length === 0 ? (
          <Text style={styles.vazio}>
            Nenhuma musica nesta playlist.
          </Text>
        ) : (
          <FlatList
            data={musicasDaPlaylist}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const ativa = estaTocando(item.id);
              const tocando = ativa && status.playing;

              return (
                <Pressable
                  style={[styles.musica, ativa && styles.musicaAtiva]}
                  onPress={() =>
                    alternarPlayPause(
                      item.id,
                      filaDaPlaylist
                    )
                  }
                  onLongPress={() => tocarProxima(item.id)}
                  delayLongPress={350}
                >
                  <Text
                    style={[
                      styles.nomeMusica,
                      ativa && styles.nomeMusicaTocando,
                    ]}
                    numberOfLines={1}
                  >
                    {item.nome}
                  </Text>

                  <Pressable
                    onPress={() =>
                      removerMusicaDaPlaylist(
                        playlistSelecionada.id,
                        item.id
                      )
                    }
                    hitSlop={10}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color="#fffcfc"
                      style={{ marginLeft: 10 }}
                    />
                  </Pressable>

                  <Ionicons
                    name={tocando ? 'pause' : 'play'}
                    size={20}
                    color={ativa ? '#2bea81' : '#fff'}
                    style={{ marginLeft: 10 }}
                  />
                </Pressable>
              );
            }}
          />
        )}
      </View>
    );
  }

  // ---------- lista de playlists ----------
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Playlists</Text>

      <Pressable
        style={styles.botao}
        onPress={() => setCriando(true)}
      >
        <Text style={styles.botaoTexto}>
          + Nova playlist
        </Text>
      </Pressable>

      {criando && (
        <View style={styles.criacao}>
          <TextInput
            style={styles.input}
            placeholder="Nome da playlist"
            placeholderTextColor="#fffefe"
            value={nome}
            onChangeText={setNome}
            autoFocus
          />

          <Pressable
            style={styles.botaoCriar}
            onPress={handleCriarPlaylist}
          >
            <Text style={styles.botaoTexto}>
              Criar
            </Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.playlist}>
            <Pressable
              style={styles.botaoPlaylist}
              onPress={() =>
                setPlaylistSelecionadaId(item.id)
              }
            >
              <MiniCapa
                musicaId={item.capaMusicaId}
                nome={item.nome}
                tamanho={52}
              />

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.nomePlaylist} numberOfLines={1}>
                  {item.nome}
                </Text>

                <Text style={styles.quantidade}>
                  {item.musicas.length} músicas
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => excluirPlaylist(item.id)}
              hitSlop={10}
            >
              <Ionicons name="trash-outline" size={20} color="#fffcfc" />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          !criando && (
            <Text style={styles.vazio}>
              Nenhuma playlist criada ainda.
            </Text>
          )
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 6 },

  titulo: { color: '#fff', fontSize: 22, marginBottom: 14, fontFamily: 'SpaceGrotesk_700Bold' },

  subtitulo: { color: '#7b9187', marginBottom: 10, fontFamily: 'SpaceGrotesk_700Bold' },

  botao: { backgroundColor: '#2bea81', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 14 },

  botaoCriar: { backgroundColor: '#2bea81', padding: 14, borderRadius: 12, alignItems: 'center' },

  botaoSecundario: { backgroundColor: '#1b2923', borderWidth: 1, borderColor: '#2b4037' },

  botaoMetade: { flex: 1 },

  linhaBotoes: { flexDirection: 'row', gap: 10 },

  botaoPlaylist: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 4 },

  botaoTexto: { color: '#0c1210', fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },

  criacao: { marginBottom: 18 },

  input: { backgroundColor: '#15201c', color: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#263a32', fontFamily: 'SpaceGrotesk_700Bold' },

  playlist: {
    backgroundColor: '#2bea81', padding: 12, borderRadius: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#2bea81',
  },

  nomePlaylist: { color: '#000000', fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },

  quantidade: { color: '#0f4b37', fontSize: 12, marginTop: 4, fontFamily: 'SpaceGrotesk_700Bold' },

  vazio: { color: '#7b9187', fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center', marginTop: 24 },

  voltar: { marginBottom: 14 },

  voltarLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  voltarTexto: { color: '#2bea81', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },

  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },

  editarCapa: { position: 'absolute', right: 4, bottom: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(12,18,16,0.85)', alignItems: 'center', justifyContent: 'center' },

  musica: {
    backgroundColor: '#295e49', padding: 14, borderRadius: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#356e57',
  },

  musicaSelecionada: { borderColor: '#2bea81', backgroundColor: '#233d32' },

  musicaAtiva: { borderColor: '#2bea81', backgroundColor: '#182922' },

  nomeMusica: { color: '#e6f0ec', fontSize: 14, flex: 1, fontFamily: 'SpaceGrotesk_700Bold' },

  nomeMusicaTocando: { color: '#2bea81' },

  pesquisa: {
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#295e49',
    color: '#fff',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_700Bold',
    borderWidth: 1,
    borderColor: '#263a32',
  },
});