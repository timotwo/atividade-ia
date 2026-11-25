import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import ListaMusicas from '../Componentes/ListaMusicas';
import ConfigPanel from '../Componentes/ConfigPanel';
import PlayerPanel from '../Componentes/PlayerPanel';
import MiniPlayer from '../Componentes/MiniPlayer';
import PlaylistsPanel from '../Componentes/PlaylistPanel';

const ABAS = [
  { chave: 'lista', icone: 'musical-notes', iconeOff: 'musical-notes-outline', rotulo: 'Músicas' },
  { chave: 'playlist', icone: 'albums', iconeOff: 'albums-outline', rotulo: 'Playlists' },
  { chave: 'config', icone: 'stats-chart', iconeOff: 'stats-chart-outline', rotulo: 'Stats & Config' },
];

export default function HomeScreen() {
  const { musicas, carregando, musicaAtual } = usePlayer();
  const [abaAtiva, setAbaAtiva] = useState('lista');

  return (
    <LinearGradient colors={['#7db29e', '#2f613e']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {abaAtiva !== 'player' && (
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.titulo}>MSC TWO</Text>
            <Text style={styles.subtitulo}>
              {carregando ? 'Sincronizando...' : `${musicas.length} músicas offline`}
            </Text>
          </View>

          {musicaAtual && (
            <Pressable style={styles.badgeTocando} onPress={() => setAbaAtiva('player')}>
              
              <Text style={styles.badgeTexto}>tocando</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.conteudo}>
        {abaAtiva === 'lista' && <ListaMusicas />}
        {abaAtiva === 'playlist' && <PlaylistsPanel />}
        {abaAtiva === 'config' && <ConfigPanel />}
        {abaAtiva === 'player' && <PlayerPanel onVoltar={() => setAbaAtiva('lista')} />}
      </View>

      {abaAtiva !== 'player' && (
        <View style={styles.rodape}>
          <MiniPlayer onPress={() => setAbaAtiva('player')} />

          <View style={styles.bottomBar}>
            {ABAS.map((aba) => {
              const ativa = abaAtiva === aba.chave;
              return (
                <Pressable
                  key={aba.chave}
                  style={[styles.navItem, ativa && styles.navItemAtivo]}
                  onPress={() => setAbaAtiva(aba.chave)}
                >
                  <Ionicons
                    name={ativa ? aba.icone : aba.iconeOff}
                    size={21}
                    color={ativa ? '#2bea81' : '#7b9187'}
                  />
                  <Text style={[styles.navTexto, ativa && styles.navTextoAtivo]}>
                    {aba.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topHeader: {
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  titulo: {
    color: '#ffffff',
    fontSize: 25,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: 1,
  },

  subtitulo: {
    color: '#083b1f',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginTop: 2,
  },

  badgeTocando: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2bea81',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },

  badgeTexto: {
    color: '#0c1210',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_700Bold',
  },

  conteudo: { flex: 1 },

  rodape: {
    backgroundColor: '#ffffff00',
    borderTopWidth: 1,
    borderTopColor: '#00ff9900',
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 14,
  },

  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },

  navItem: {
    
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    gap: 4,
  },

  navItemAtivo: {
    backgroundColor: 'rgba(153, 234, 189, 0.1)',
  },

  navTexto: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_700Bold',
  },

  navTextoAtivo: {
    color: '#2bea81',
  },
});