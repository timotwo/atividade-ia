import { useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../contexts/PlayerContext';
import { formatarTempo } from './visual';

export default function ListaMusicas() {
  const {
    musicas,
    estaTocando,
    alternarPlayPause,
    tocarProxima,
    carregando,
    carregarMusicas,
    permissionResponse,
    status,
  } = usePlayer();

  const [pesquisa, setPesquisa] = useState('');
  const [aviso, setAviso] = useState(null);
  const timerAviso = useRef(null);

  const musicasFiltradas = musicas.filter((musica) =>
    musica.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const filaCompleta = musicasFiltradas.map((m) => m.id);

  function mostrarAviso(texto) {
    setAviso(texto);
    clearTimeout(timerAviso.current);
    timerAviso.current = setTimeout(() => setAviso(null), 1800);
  }

  function handleTocarProxima(item) {
    const resultado = tocarProxima(item.id);
    if (resultado === 'fila') {
      mostrarAviso(`"${item.nome}" toca a seguir`);
    } else if (resultado === 'tocando') {
      mostrarAviso('Nada tocando — iniciando agora');
    }
  }

  return (
    <View style={styles.container}>
      {!carregando && !permissionResponse?.granted && (
        <Pressable style={styles.permissaoBotao} onPress={carregarMusicas}>
          <Text style={styles.permissaoTexto}>Permitir acesso aos arquivos</Text>
        </Pressable>
      )}

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#7b9187" />
        <TextInput
          style={styles.pesquisa}
          placeholder="Buscar na biblioteca..."
          placeholderTextColor="#7b9187"
          value={pesquisa}
          onChangeText={setPesquisa}
        />
        {pesquisa.length > 0 && (
          <Pressable onPress={() => setPesquisa('')}>
            <Ionicons name="close-circle" size={18} color="#7b9187" />
          </Pressable>
        )}
      </View>

      <FlatList
        data={musicasFiltradas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => {
          const ativa = estaTocando(item.id);

          return (
            <Pressable
              style={[styles.musica, ativa && styles.musicaAtiva]}
              onPress={() => alternarPlayPause(item.id, filaCompleta)}
              onLongPress={() => handleTocarProxima(item)}
              delayLongPress={350}
            >
              <View style={[styles.iconeBox, ativa && styles.iconeBoxAtivo]}>
                <Ionicons
                  name={ativa && status.playing ? 'volume-high' : 'musical-note'}
                  size={17}
                  color={ativa ? '#0c1210' : '#2bea81'}
                />
              </View>

              <View style={styles.info}>
                <Text
                  style={[styles.nomeMusica, ativa && styles.nomeMusicaAtiva]}
                  numberOfLines={1}
                >
                  {item.nome}
                </Text>
                <Text style={styles.duracao}>{formatarTempo(item.duracao)}</Text>
              </View>

              <Pressable
                onPress={() => handleTocarProxima(item)}
                hitSlop={10}
                style={styles.botaoFila}
              >
                <Ionicons name="play-skip-forward-circle-outline" size={22} color="#7b9187" />
              </Pressable>

              <Ionicons
                name={ativa && status.playing ? 'pause-circle' : 'play-circle'}
                size={28}
                color={ativa ? '#2bea81' : '#586e64'}
              />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !carregando && (
            <Text style={styles.vazio}>
              {pesquisa ? 'Nenhuma música encontrada...' : 'Nenhuma música por aqui...'}
            </Text>
          )
        }
      />

      {aviso && (
        <View pointerEvents="none" style={styles.avisoWrap}>
          <View style={styles.aviso}>
            <Ionicons name="list" size={16} color="#2bea81" />
            <Text style={styles.avisoTexto} numberOfLines={1}>{aviso}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  permissaoBotao: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2bea81',
    alignItems: 'center',
  },

  permissaoTexto: { color: '#0c1210', fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(30, 72, 56)',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2c8867',
    gap: 10,
  },

  pesquisa: {
    flex: 1,
    paddingVertical: 11,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_700Bold',
  },

  musica: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#295e49',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },

  musicaAtiva: {
    backgroundColor: '#123c22',
    borderColor: 'rgba(12, 59, 34, 0.45)',
  },

  iconeBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconeBoxAtivo: { backgroundColor: '#2bea81' },

  info: { flex: 1 },

  nomeMusica: {
    color: '#e6f0ec',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_700Bold',
  },

  nomeMusicaAtiva: { color: '#2bea81' },

  duracao: {
    color: '#b4c6be',
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginTop: 2,
  },

  botaoFila: { padding: 4 },

  vazio: {
    color: '#7b9187',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
    fontFamily: 'SpaceGrotesk_700Bold',
  },

  avisoWrap: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    alignItems: 'center',
  },

  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1b2923',
    borderWidth: 1,
    borderColor: '#2bea81',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  avisoTexto: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'SpaceGrotesk_700Bold',
    flexShrink: 1,
  },
});