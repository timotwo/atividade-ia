import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ---------- utilidades de texto/tempo ----------

export function formatarTempo(segundos) {
  const s = Math.max(0, Math.floor(segundos || 0));
  const minutos = Math.floor(s / 60);
  const resto = s % 60;
  return `${minutos}:${resto.toString().padStart(2, '0')}`;
}

export function formatarDuracao(segundos) {
  const total = Math.max(0, Math.floor(segundos || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

export function chaveMes(data = new Date()) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function nomeDoMes(data = new Date()) {
  return `${MESES[data.getMonth()]} de ${data.getFullYear()}`;
}

export function iniciais(nome = '') {
  const palavras = nome
    .replace(/[^A-Za-z0-9À-ÿ\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (palavras.length === 0) return '♪';
  if (palavras.length === 1) return palavras[0].slice(0, 2).toUpperCase();
  return (palavras[0][0] + palavras[1][0]).toUpperCase();
}

// ---------- paleta ----------

function hslParaHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) =>
    Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// Paleta determinística a partir do nome da música (4 cores)
export function gerarPaleta(nome = '') {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = (hash * 31 + nome.charCodeAt(i)) % 360;
  }
  const h = Math.abs(hash) % 360;

  return [
    hslParaHex(h, 62, 42),
    hslParaHex((h + 35) % 360, 66, 24),
    hslParaHex((h + 180) % 360, 70, 58),
    
  ];
}

// ---------- cores (hex) ----------

function hexParaRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function escurecerHex(hex, fator = 0.6) {
  const [r, g, b] = hexParaRgb(hex);
  const t = (x) => Math.round(x * fator).toString(16).padStart(2, '0');
  return `#${t(r)}${t(g)}${t(b)}`;
}

export function ehClaro(hex) {
  const [r, g, b] = hexParaRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

// ---------- Capa quadrada (playlists) ----------

export function CapaQuadrada({ capa, nome, tamanho = 56, raio }) {
  const [c1, c2] = gerarPaleta(nome);
  const r = raio ?? tamanho * 0.18;

  if (capa) {
    return (
      <Image
        source={{ uri: capa }}
        style={{ width: tamanho, height: tamanho, borderRadius: r }}
      />
    );
  }

  return (
    <LinearGradient
      colors={[c1, c2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: r,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: '#fff',
          fontSize: tamanho * 0.34,
          fontFamily: 'SpaceGrotesk_700Bold',
        }}
      >
        {iniciais(nome)}
      </Text>
    </LinearGradient>
  );
}

// ---------- Disco (vinil / capa redonda) ----------

export function Disco({ capa, nome, tamanho = 220 }) {
  const [c1, c2] = gerarPaleta(nome);
  const aneis = [0.9, 0.78, 0.66, 0.54];
  const labelTam = tamanho * 0.4;
  const furo = tamanho * 0.05;

  return (
    <View
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111',
      }}
    >
      {capa ? (
        <Image
          source={{ uri: capa }}
          style={{ width: tamanho, height: tamanho }}
        />
      ) : (
        <>
          <LinearGradient
            colors={[c1, c2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {aneis.map((r) => (
            <View
              key={r}
              style={{
                position: 'absolute',
                width: tamanho * r,
                height: tamanho * r,
                borderRadius: (tamanho * r) / 2,
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.18)',
              }}
            />
          ))}

          <LinearGradient
            colors={[c2, c1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: labelTam,
              height: labelTam,
              borderRadius: labelTam / 2,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.35)',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: tamanho * 0.13,
                fontFamily: 'SpaceGrotesk_700Bold',
                marginBottom: furo,
              }}
            >
              {iniciais(nome)}
            </Text>
          </LinearGradient>
        </>
      )}

      {/* furo central */}
      <View
        style={{
          position: 'absolute',
          width: furo,
          height: furo,
          borderRadius: furo / 2,
          backgroundColor: '#0d111400',
          borderWidth: 0,
          borderColor: 'rgba(34, 8, 8, 0)',
        }}
      />
    </View>
  );
}
