import { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Easing, Modal, Alert, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { usePlayer } from '../contexts/PlayerContext';
import { Disco, CapaQuadrada, gerarPaleta, formatarTempo, escurecerHex, ehClaro } from './visual';

const VOLTA_MS = 12000;

const CORES_PRONTAS = [
  '#2f613e', '#0d1114', '#ffffff', '#f4c542',
  '#ef8564', '#608ece', '#bf62e4', '#ff7eb6', '#ad1123',
];

function gerarOndas() {
  return Array.from({ length: 15 }, () => Math.floor(Math.random() * 20) + 6);
}

export default function PlayerPanel({ onVoltar }) {
  const {
    musicaAtual, capaAtual, status, player, stats,
    proximaMusica, musicaAnterior, alternarPlayPause,
  } = usePlayer();

  const [cardAberto, setCardAberto] = useState(false);
  const [corCard, setCorCard] = useState(null);
  const [usarGradiente, setUsarGradiente] = useState(true);
  const [ondas, setOndas] = useState(() => gerarOndas());
  const cardRef = useRef(null);

  const girar = useRef(new Animated.Value(0)).current;
  const valorRef = useRef(0);

  useEffect(() => {
    if (!status.playing) return;

    let ativo = true;
    let anim = null;

    function rodar() {
      const resto = 1 - valorRef.current;
      anim = Animated.timing(girar, {
        toValue: 1,
        duration: Math.max(200, resto * VOLTA_MS),
        easing: Easing.linear,
        useNativeDriver: true,
      });
      anim.start(({ finished }) => {
        if (finished && ativo) {
          valorRef.current = 0;
          girar.setValue(0);
          rodar();
        }
      });
    }

    girar.setValue(valorRef.current);
    rodar();

    return () => {
      ativo = false;
      girar.stopAnimation((v) => {
        valorRef.current = v % 1;
      });
    };
  }, [status.playing]);

  const rotacao = girar.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  async function compartilhar() {
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Compartilhar', 'Compartilhamento indisponível neste aparelho.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Compartilhar card',
        UTI: 'public.png',
      });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível gerar o card.');
    }
  }

  if (!musicaAtual) {
    return (
      <View style={styles.container}>
        <Text style={styles.nome}>Nenhuma música tocando</Text>
      </View>
    );
  }

  const paleta = gerarPaleta(musicaAtual.nome);
  const vezesOuvida = stats?.[musicaAtual.id]?.plays ?? 0;

  const corBase = corCard ?? paleta[0];
  const claro = ehClaro(corBase);
  const corTexto = claro ? '#111111' : '#ffffff';
  const corTextoSuave = claro ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)';
  const corMarca = claro ? '#2f613e' : '#2bea81';

  const coresDisponiveis = [...new Set([...paleta, ...CORES_PRONTAS])];

  const conteudoCard = (
    <>
      <Pressable onPress={() => setOndas(gerarOndas())} style={styles.ondasTopo}>
        {ondas.map((altura, index) => (
          <View
            key={index}
            style={[
              styles.ondaBarra,
              { height: altura, backgroundColor: corTextoSuave },
            ]}
          />
        ))}
      </Pressable>

      <CapaQuadrada
        capa={capaAtual}
        nome={musicaAtual.nome}
        tamanho={210}
        raio={24}
      />

      <View style={styles.cardInfo}>
        <Text style={[styles.cardNome, { color: corTexto }]} numberOfLines={3}>
          {musicaAtual.nome}
        </Text>

        {vezesOuvida > 0 && (
          <Text style={[styles.cardSub, { color: corTextoSuave }]}>
            ouvida {vezesOuvida} {vezesOuvida === 1 ? 'vez' : 'vezes'}
          </Text>
        )}
      </View>

      <Text style={[styles.marcaDagua, { color: corMarca }]}>MSC TWO</Text>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Barra superior com Minimizar e Compartilhar Card */}
      <View style={styles.topo}>
        <Pressable onPress={onVoltar} hitSlop={10} style={styles.botaoTopo}>
          <Ionicons name="chevron-down" size={26} color="#e6f0ec" />
        </Pressable>

        <Text style={styles.topoTitulo}>TOCANDO AGORA</Text>

        <Pressable
          onPress={() => {
            setOndas(gerarOndas());
            setCardAberto(true);
          }}
          hitSlop={10}
          style={styles.botaoTopo}
        >
          <Ionicons name="share-social-outline" size={24} color="#ffffff" />
        </Pressable>
      </View>

      <Animated.View style={[styles.discoWrap, { transform: [{ rotate: rotacao }] }]}>
        <Disco capa={capaAtual} nome={musicaAtual.nome} tamanho={250} />
      </Animated.View>

      <View>
        <Text style={styles.nome} numberOfLines={2}>{musicaAtual.nome}</Text>
        {vezesOuvida > 0 && (
          <Text style={styles.subOuvida}>
            Ouvida {vezesOuvida} {vezesOuvida === 1 ? 'vez' : 'vezes'}
          </Text>
        )}
      </View>

      <View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={status.duration || 1}
          value={status.currentTime}
          minimumTrackTintColor="#2bea81"
          maximumTrackTintColor="#24362f"
          thumbTintColor="#2bea81"
          onSlidingComplete={(v) => player.seekTo(v)}
        />

        <View style={styles.tempos}>
          <Text style={styles.tempo}>{formatarTempo(status.currentTime)}</Text>
          <Text style={styles.tempo}>{formatarTempo(status.duration)}</Text>
        </View>
      </View>

      <View style={styles.controles}>
        <Pressable onPress={musicaAnterior} hitSlop={10}>
          <Ionicons name="play-skip-back" size={32} color="#e6f0ec" />
        </Pressable>

        <Pressable
          style={styles.botaoPlay}
          onPress={() => alternarPlayPause(musicaAtual.id)}
        >
          <Ionicons
            name={status.playing ? 'pause' : 'play'}
            size={34}
            color="#0c1210"
            style={status.playing ? null : { marginLeft: 3 }}
          />
        </Pressable>

        <Pressable onPress={proximaMusica} hitSlop={10}>
          <Ionicons name="play-skip-forward" size={32} color="#e6f0ec" />
        </Pressable>
      </View>

      {/* Modal do card compartilhável */}
      <Modal
        visible={cardAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setCardAberto(false)}
      >
        <View style={styles.modalFundo}>
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            <View ref={cardRef} collapsable={false} style={styles.card}>
              {usarGradiente ? (
                <LinearGradient
                  colors={[escurecerHex(corBase, 0.55), corBase, escurecerHex(corBase, 0.8)]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.6, y: 1 }}
                  style={styles.cardInterno}
                >
                  {conteudoCard}
                </LinearGradient>
              ) : (
                <View style={[styles.cardInterno, { backgroundColor: corBase }]}>
                  {conteudoCard}
                </View>
              )}
            </View>

            <View style={styles.opcoes}>
              <Text style={styles.opcaoTitulo}>Fundo</Text>

              <View style={styles.chips}>
                <Pressable
                  style={[styles.chip, usarGradiente && styles.chipAtivo]}
                  onPress={() => setUsarGradiente(true)}
                >
                  <Text style={styles.chipTexto}>Gradiente</Text>
                </Pressable>

                <Pressable
                  style={[styles.chip, !usarGradiente && styles.chipAtivo]}
                  onPress={() => setUsarGradiente(false)}
                >
                  <Text style={styles.chipTexto}>Cor sólida</Text>
                </Pressable>
              </View>

              <Text style={styles.opcaoTitulo}>Cor do card</Text>

              <View style={styles.cores}>
                {coresDisponiveis.map((cor) => {
                  const selecionada = corBase.toLowerCase() === cor.toLowerCase();

                  return (
                    <Pressable
                      key={cor}
                      onPress={() => setCorCard(cor)}
                      style={[
                        styles.corBolinha,
                        { backgroundColor: cor },
                        selecionada && styles.corSelecionada,
                      ]}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.modalBotoes}>
              <Pressable style={styles.modalBotao} onPress={compartilhar}>
                <Ionicons name="share-social" size={20} color="#0c1210" />
                <Text style={[styles.modalBotaoTexto, { color: '#0c1210' }]}>Compartilhar</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBotao, styles.modalBotaoSec]}
                onPress={() => setCardAberto(false)}
              >
                <Ionicons name="close" size={20} color="#fff" />
                <Text style={styles.modalBotaoTexto}>Fechar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 34,
    justifyContent: 'space-between',
  },

  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  botaoTopo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#213e34',
    alignItems: 'center',
    justifyContent: 'center',
  },

  topoTitulo: {
    color: '#ffffff',
    fontSize: 12,
    letterSpacing: 2,
    fontFamily: 'SpaceGrotesk_700Bold',
  },

  discoWrap: {
    alignSelf: 'center',
    shadowColor: '#2bea81',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 10,
  },

  nome: {
    color: '#ffffff',
    fontSize: 22,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk_700Bold',
  },

  subOuvida: {
    color: '#030705',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    fontFamily: 'SpaceGrotesk_700Bold',
  },

  slider: { width: '100%', height: 28 },

  tempos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },

  tempo: {
    color: '#203d30',
    fontSize: 17,
    fontFamily: 'SpaceGrotesk_700Bold',
  },

  controles: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },

  botaoPlay: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },

  modalScroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },

  card: {
  width: 270,
  height: 480,
},

  cardInterno: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },

  cardInfo: {
    alignItems: 'center',
    gap: 8,
  },

  cardNome: { fontSize: 20, textAlign: 'center', fontFamily: 'SpaceGrotesk_700Bold' },

  cardSub: { fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold' },

  ondasTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 26,
  },

  ondaBarra: {
    width: 3,
    borderRadius: 2,
  },

  marcaDagua: { fontSize: 18, letterSpacing: 4, fontFamily: 'SpaceGrotesk_700Bold' },

  opcoes: { width: 270, marginTop: 18 },

  opcaoTitulo: { color: '#7b9187', fontSize: 12, marginBottom: 8, marginTop: 6, fontFamily: 'SpaceGrotesk_700Bold' },

  chips: { flexDirection: 'row', gap: 8, marginBottom: 6 },

  chip: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#16231e', alignItems: 'center', borderWidth: 1, borderColor: '#263a32' },

  chipAtivo: { borderColor: '#2bea81', backgroundColor: '#1d3029' },

  chipTexto: { color: '#fff', fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold' },

  cores: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  corBolinha: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },

  corSelecionada: { borderColor: '#2bea81', borderWidth: 3 },

  modalBotoes: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 10 },

  modalBotao: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2bea81', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14 },

  modalBotaoSec: { backgroundColor: '#1c2a24' },

  modalBotaoTexto: { color: '#fff', fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },
});