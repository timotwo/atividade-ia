import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../contexts/PlayerContext';
import { chaveMes, nomeDoMes, formatarDuracao } from './visual';

export default function ConfigScreen() {
  const { musicas, stats } = usePlayer();

  const mes = chaveMes();

  const top5 = Object.entries(stats)
    .map(([id, s]) => ({
      id,
      nome: s.nome,
      plays: s.mensal?.[mes]?.plays ?? 0,
      segundos: s.mensal?.[mes]?.segundos ?? 0,
    }))
    .filter((m) => m.plays > 0)
    .sort((a, b) => b.plays - a.plays || b.segundos - a.segundos)
    .slice(0, 5);

  const valores = Object.values(stats);
  const totalSegundosOuvidos = valores.reduce((acc, s) => acc + (s.segundos || 0), 0);
  const totalReproducoes = valores.reduce((acc, s) => acc + (s.plays || 0), 0);
  const duracaoBiblioteca = musicas.reduce((acc, m) => acc + (m.duracao || 0), 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.texto}>Configurações</Text>

      {/* resumo */}
      <View style={styles.resumo}>
        <View style={styles.caixa}>
          <Ionicons name="headset" size={22} color="#2bea81" />
          <Text style={styles.caixaValor}>{formatarDuracao(totalSegundosOuvidos)}</Text>
          <Text style={styles.caixaRotulo}>tempo ouvido</Text>
        </View>

        <View style={styles.caixa}>
          <Ionicons name="repeat" size={22} color="#2bea81" />
          <Text style={styles.caixaValor}>{totalReproducoes}</Text>
          <Text style={styles.caixaRotulo}>reproduções</Text>
        </View>
      </View>

      <View style={styles.resumo}>
        <View style={styles.caixa}>
          <Ionicons name="musical-notes" size={22} color="#2bea81" />
          <Text style={styles.caixaValor}>{musicas.length}</Text>
          <Text style={styles.caixaRotulo}>músicas no aparelho</Text>
        </View>

        <View style={styles.caixa}>
          <Ionicons name="time" size={22} color="#2bea81" />
          <Text style={styles.caixaValor}>{formatarDuracao(duracaoBiblioteca)}</Text>
          <Text style={styles.caixaRotulo}>de música no aparelho</Text>
        </View>
      </View>

      {/* top 5 do mês */}
      <Text style={styles.secao}>Top 5 do mês</Text>
      <Text style={styles.subtexto}>{nomeDoMes()}</Text>

      {top5.length === 0 ? (
        <Text style={styles.vazio}>
          Ouça algumas músicas para ver o ranking aqui.
        </Text>
      ) : (
        top5.map((m, i) => (
          <View key={m.id} style={styles.linha}>
            <Text style={styles.posicao}>{i + 1}</Text>

            <View style={{ flex: 1 }}>
              <Text style={styles.nomeMusica} numberOfLines={1}>{m.nome}</Text>
              <Text style={styles.detalhe}>
                {m.plays} {m.plays === 1 ? 'vez' : 'vezes'} · {formatarDuracao(m.segundos)}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 40 },

  texto: { color: '#fff', fontSize: 22, marginBottom: 16, fontFamily: 'SpaceGrotesk_700Bold' },

  subtexto: { color: '#2bea81', fontSize: 13, marginBottom: 14, fontFamily: 'SpaceGrotesk_700Bold' },

  resumo: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  caixa: {
    flex: 1, backgroundColor: '#194435', borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#1f2e2800',
  },

  caixaValor: { color: '#ffffff', fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },

  caixaRotulo: { color: '#7b9187', fontSize: 11, textAlign: 'center', fontFamily: 'SpaceGrotesk_700Bold' },

  secao: { color: '#fff', fontSize: 20, marginTop: 20, marginBottom: 2, fontFamily: 'SpaceGrotesk_700Bold' },

  linha: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#295e49', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#356e57',
  },

  posicao: { color: '#2bea81', fontSize: 20, width: 26, textAlign: 'center', fontFamily: 'SpaceGrotesk_700Bold' },

  nomeMusica: { color: '#e6f0ec', fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },

  detalhe: { color: '#7b9187', fontSize: 12, marginTop: 3, fontFamily: 'SpaceGrotesk_700Bold' },

  vazio: { color: '#7b9187', fontSize: 14, marginTop: 10, fontFamily: 'SpaceGrotesk_700Bold' },
});