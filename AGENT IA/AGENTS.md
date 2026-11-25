# AGENTS.md — Diretrizes de Desenvolvimento para o Projeto MSC TWO

Este arquivo define a arquitetura, convenções e regras de negócio que qualquer agente de IA deve seguir ao modificar ou expandir este repositório.

## 1. Visão Geral da Arquitetura
- **Stack:** React Native com Expo (JavaScript puro, sem TypeScript).
- **Gerenciamento de Estado:** Centralizado exclusivamente em `contexts/PlayerContext.js` via hook `usePlayer()`. Não crie estados locais duplicados de reprodução ou playlists nos componentes.
- **Persistência:** `AsyncStorage` utilizando estritamente as chaves `@playlists` e `@stats`.

## 2. Convenções de Código e Estilo
- **Idioma:** Nomes de variáveis, funções, estados e comentários devem ser escritos em **Português (pt-BR)** para manter consistência com a base existente (`musicaAtual`, `alternarPlayPause`, `capaAtual`).
- **Tipografia:** Utilize sempre `fontFamily: 'SpaceGrotesk_700Bold'` nos componentes `<Text>` e `<TextInput>`.
- **Paleta de Cores Principal:**
  - Verde Floresta: `#2f613e`
  - Verde Oliva: `#a0b27d`
  - Verde Neon / Destaque: `#2bea81` e `#b0ffa4`
  - Superfícies Escuras: `#0c1210`, `#131c19`, `#182922`
  - Papel / Claro: `#f2ecec`, `#eef7e9`

## 3. Regras Críticas (Não Quebrar)
1. **Sanitização de Capas (`corrigirPictureData`):** Muitos arquivos MP3 possuem bytes de lixo antes do cabeçalho da imagem na tag ID3. Nunca remova a varredura pelos magic bytes JPEG (`0xFF 0xD8 0xFF`) e PNG (`0x89 0x50 0x4E 0x47`) em `PlayerContext.js`.
2. **Contabilização de Tempo (`@stats`):** Nunca some `status.currentTime` diretamente ao total ouvido. Mantenha a verificação de delta (`0 < delta < 3`) para impedir que o usuário arrastando o `Slider` falsifique o tempo ouvido.
3. **Cache de Capas:** Ao renderizar listas de playlists, sempre utilize o componente `<MiniCapa />` conectado a `garantirCapa(id)` e `capasCache` para evitar gargalos de I/O.
4. **Captura de Card (`view-shot`):** Ao capturar `cardRef` para compartilhamento no Android, evite `borderRadius` na `<View>` raiz capturada sem fundo sólido opaco, pois a rasterização nativa preenche cantos transparentes com preto.

## 4. Comandos Úteis
- Iniciar servidor de desenvolvimento: `npx expo start`
- Gerar APK de teste: `eas build -p android --profile preview`
- Gerar AAB para Play Store: `eas build -p android --profile production`