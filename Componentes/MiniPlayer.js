import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../contexts/PlayerContext';
import { Disco } from './visual';

export default function MiniPlayer({ onPress }) {
  const { musicaAtual, capaAtual, status, proximaMusica, alternarPlayPause } = usePlayer();

  if (!musicaAtual) return null;

  const progresso = status.duration ? (status.currentTime / status.duration) * 100 : 0;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.linha}>
        <Disco capa={capaAtual} nome={musicaAtual.nome} tamanho={42} />

        <View style={styles.info}>
          <Text style={styles.nome} numberOfLines={1}>
            {musicaAtual.nome}
          </Text>
          <Text style={styles.sub}>
            {status.playing ? 'Tocando agora · toque para abrir' : 'Pausado'}
          </Text>
        </View>

        <View style={styles.controles}>
          <Pressable
            style={styles.botaoPlay}
            onPress={() => alternarPlayPause(musicaAtual.id)}
          >
            <Ionicons
              name={status.playing ? 'pause' : 'play'}
              size={18}
              color="#0c1210"
              style={status.playing ? null : { marginLeft: 2 }}
            />
          </Pressable>

          <Pressable onPress={proximaMusica} hitSlop={10}>
            <Ionicons name="play-skip-forward" size={22} color="#e6f0ec" />
          </Pressable>
        </View>
      </View>

      <View style={styles.barraFundo}>
        <View style={[styles.barraProgresso, { width: `${progresso}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f433f',
    borderRadius: 16,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#0f433f',
  },

  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  info: { flex: 1 },

  nome: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_700Bold',
  },

  sub: {
    color: '#2bea81',
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginTop: 2,
  },

  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingRight: 4,
  },

  botaoPlay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2bea81',
    alignItems: 'center',
    justifyContent: 'center',
  },

  barraFundo: {
    height: 3,
    backgroundColor: '#405a4f',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },

  barraProgresso: {
    height: 3,
    backgroundColor: '#2bea81',
  },
});