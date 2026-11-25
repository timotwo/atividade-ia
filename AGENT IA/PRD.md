# PRD — MSC TWO (Reprodutor de Áudio Offline com Identidade Visual Dinâmica)

**Tipo:** Aplicativo Mobile (React Native / Expo)  
**Data:** 25/11/2026  
**Status:** Concluído (MVP v1.0)

---

## 1. Visão geral

### 1.1 Problema
Reprodutores de música locais padrão no Android costumam apresentar interfaces poluídas, excesso de anúncios, dificuldade para filtrar áudios curtos indesejados (como notas de voz de mensageiros) e ausência de recursos modernos de engajamento, como estatísticas de consumo e compartilhamento visual para redes sociais.

### 1.2 Objetivo
Desenvolver um aplicativo mobile offline em React Native (Expo) que indexe automaticamente os arquivos de áudio locais do dispositivo, filtre faixas irrelevantes, extraia metadados e capas embutidas, gerencie playlists e filas dinâmicas e ofereça recursos visuais autorais (disco animado, paleta determinística por faixa, estatísticas mensais e cards compartilháveis).

### 1.3 Objetivos mensuráveis
- Indexar e exibir a biblioteca de músicas locais do aparelho em menos de 3 segundos após a concessão de permissão.
- Filtrar automaticamente arquivos de áudio com duração inferior a 53 segundos para eliminar gravações curtas e áudios de mensageiros.
- Permitir adicionar qualquer música à fila imediata ("Tocar a seguir") com um toque longo (`onLongPress`) ou botão dedicado sem interromper a faixa atual.
- Gerar e exportar um card de compartilhamento em PNG de alta qualidade em menos de 2 segundos.

### 1.4 Público-alvo
Usuários de smartphones Android que mantêm coleções locais de música em MP3/áudio offline e buscam um player leve, sem anúncios, com estética minimalista e recursos sociais.

---

## 2. Perfis de usuário e permissões

O aplicativo opera 100% localmente no dispositivo (single-user, sem autenticação remota), dependendo apenas das permissões do sistema operacional:

| Perfil / Estado | Descrição | Pode |
| :--- | :--- | :--- |
| **Usuário Autorizado** | Concedeu permissão `MediaLibrary` (`READ_MEDIA_AUDIO`) | Escanear biblioteca, reproduzir faixas, gerenciar fila, criar/editar playlists, personalizar capas, visualizar estatísticas e gerar cards |
| **Usuário Sem Permissão** | Negou ou ainda não concedeu acesso à mídia | Visualizar tela inicial com botão de solicitação de acesso; sem acesso à leitura de arquivos |

---

## 3. Escopo

### 3.1 Dentro do escopo (MVP)
1. **Indexação e Filtragem de Biblioteca Local:** Leitura paginada de ativos de áudio via `expo-media-library` com filtro de duração mínima (`>= 53s`) e ordenação alfabética em português (`pt-BR`).
2. **Reprodução em Segundo Plano e Tela de Bloqueio:** Áudio persistente em background e controles nativos na tela de bloqueio (`setActiveForLockScreen`).
3. **Extração e Recuperação de Capas:** Leitura de tags ID3/metadados via `expo-music-info-2` com sanitização binária de cabeçalhos JPEG/PNG (`corrigirPictureData`) e fallback visual determinístico.
4. **Fila Dinâmica ("Tocar a seguir"):** Inserção de faixas logo após a música atual sem resetar a fila principal.
5. **Gerenciamento de Playlists:** Criação, exclusão, busca e adição múltipla de faixas, remoção individual e escolha de capa personalizada por playlist, com persistência local via `AsyncStorage`.
6. **Estatísticas de Reprodução:** Contabilização automática de reproduções (`plays`) e tempo efetivamente ouvido (`segundos`), agrupados por histórico total e por mês (`YYYY-MM`), com ranking Top 5 mensal.
7. **Card Compartilhável Estilo Stories:** Captura de componente nativo (`react-native-view-shot`) com ondas sonoras aleatórias, escolha de cor (paleta da música ou cores prontas), modo gradiente ou sólido e envio via `expo-sharing`.

### 3.2 Fora do escopo (nesta versão)
- Streaming online ou integração com APIs de música (Spotify, YouTube Music, Deezer).
- Sincronização em nuvem ou login de usuário.
- Equalizador de áudio multibanda e controle de velocidade/pitch (*Slowed / Sped Up*).
- Edição de tags ID3 diretamente no arquivo MP3.
- Letra sincronizada (`.lrc`).
- Suporte a iOS publicado na App Store (foco inicial em Android / Play Store).

---

## 4. Requisitos funcionais

### 4.1 Biblioteca e Busca
| ID | Requisito | Prioridade |
| :--- | :--- | :--- |
| RF01 | O sistema deve solicitar permissão de acesso aos arquivos de áudio do dispositivo ao iniciar | Alta |
| RF02 | O sistema deve carregar todos os arquivos de áudio de forma paginada (`first: 200`) e filtrar apenas arquivos com duração $\ge 53$ segundos | Alta |
| RF03 | O sistema deve remover a extensão `.mp3` do nome do arquivo e ordenar a lista alfabeticamente (`pt-BR`) | Alta |
| RF04 | O sistema deve permitir filtrar músicas em tempo real pelo nome através de campo de busca | Alta |

### 4.2 Reprodução e Fila
| ID | Requisito | Prioridade |
| :--- | :--- | :--- |
| RF05 | O usuário deve poder iniciar, pausar e alternar faixas diretamente da lista de músicas, playlist ou player | Alta |
| RF06 | O sistema deve avançar automaticamente para a próxima faixa da fila ao atingir o final da música atual (`duration - 0.3s`) | Alta |
| RF07 | O usuário deve poder avançar, retroceder e navegar pela linha do tempo (`seekTo`) tanto no `PlayerPanel` quanto no `MiniPlayer` | Alta |
| RF08 | O usuário deve poder inserir uma música para tocar imediatamente a seguir (`tocarProxima`) via toque longo ou botão de fila, exibindo confirmação visual | Alta |
| RF09 | O áudio deve continuar tocando em segundo plano e exibir título e controles na tela de bloqueio | Alta |

### 4.3 Capas e Identidade Visual
| ID | Requisito | Prioridade |
| :--- | :--- | :--- |
| RF10 | O sistema deve extrair a imagem embutida nos metadados da faixa e corrigir eventuais bytes corrompidos antes do cabeçalho JPEG (`FF D8 FF`) ou PNG (`89 50 4E 47`) | Alta |
| RF11 | Caso a faixa não possua capa embutida, o sistema deve gerar uma capa determinística a partir do hash do nome da música com iniciais e paleta de 3 cores | Média |
| RF12 | O `PlayerPanel` deve exibir um disco girando em animação contínua sincronizada com o estado `status.playing` | Média |

### 4.4 Playlists
| ID | Requisito | Prioridade |
| :--- | :--- | :--- |
| RF13 | O usuário deve poder criar e excluir playlists personalizadas salvas localmente (`@playlists`) | Alta |
| RF14 | O usuário deve poder pesquisar e selecionar múltiplas músicas para adicionar a uma playlist | Alta |
| RF15 | O usuário deve poder remover músicas de uma playlist e definir qual música fornecerá a capa oficial da playlist | Média |

### 4.5 Estatísticas e Compartilhamento
| ID | Requisito | Prioridade |
| :--- | :--- | :--- |
| RF16 | O sistema deve contabilizar cada reprodução iniciada e acumular os segundos ouvidos em tempo real, salvando no `@stats` ao pausar ou trocar de faixa | Média |
| RF17 | A tela de `Stats & Config` deve exibir tempo total ouvido, total de reproduções, total de faixas, duração da biblioteca e o ranking Top 5 do mês corrente | Média |
| RF18 | O usuário deve poder abrir um modal no player com um card personalizável (gradiente/sólido, paleta de cores e 15 barras de onda sonora aleatórias) e compartilhá-lo como imagem PNG | Média |

---

## 5. Regras de negócio

- **RN01 — Filtro de Duração:** Arquivos de áudio com menos de `53` segundos são descartados na varredura para evitar poluição da biblioteca por áudios curtos de mensageiros e toques de sistema.
- **RN02 — Inserção na Fila Manual:** Ao acionar `tocarProxima(id)`, a música é inserida na posição `indiceNaFila + 1 + qtdManualRef`. Se o usuário selecionar uma nova lista completa para tocar, o contador de fila manual é zerado.
- **RN03 — Persistência de Estatísticas:** O tempo ouvido só é incrementado enquanto `status.playing === true` e quando o delta entre leituras consecutivas de `currentTime` está entre `0` e `3` segundos (evitando que saltos manuais no slider inflam o tempo ouvido). O salvamento no `AsyncStorage` ocorre a cada `10` segundos acumulados ou imediatamente ao pausar/trocar de faixa.
- **RN04 — Integridade de Capa da Playlist:** Se a música escolhida como capa de uma playlist for removida dessa playlist, o campo `capaMusicaId` é automaticamente resetado para `null` (voltando ao padrão de iniciais).
- **RN05 — Contraste Adaptativo no Card:** A cor do texto e das ondas no card compartilhável alterna automaticamente entre escuro (`#111111`) e claro (`#ffffff`) com base na luminância percebida da cor de fundo (`ehClaro(hex) > 0.62`).

---

## 6. Requisitos não funcionais

| ID | Requisito |
| :--- | :--- |
| **RNF01** | **Desempenho e Cache:** Capas de playlists são carregadas sob demanda e armazenadas em memória (`capasCache` + `capasPedidasRef`) para evitar leituras repetidas de disco durante a rolagem da lista. |
| **RNF02** | **Animação Fluida:** A rotação do disco no player deve utilizar `useNativeDriver: true` para rodar na thread nativa sem bloquear a interface JavaScript. |
| **RNF03** | **Offline-First:** Todo o funcionamento do aplicativo (leitura, playlists, estatísticas, geração de capas e cards) deve operar 100% sem conexão com a internet. |
| **RNF04** | **Manutenibilidade:** Estado global de áudio, fila, playlists e métricas centralizado no `PlayerContext`, desacoplado dos componentes de apresentação. |
| **RNF05** | **Compatibilidade Android:** Suporte às permissões granulares de mídia do Android (`READ_MEDIA_AUDIO` e `READ_EXTERNAL_STORAGE`). |

---

## 7. Modelo de dados (Armazenamento Local)

Como o aplicativo é offline-first, os dados persistentes são armazenados em JSON no `AsyncStorage`:

```text
@playlists (Array<Playlist>)
  ├── id: string (timestamp)
  ├── nome: string
  ├── musicas: Array<string> (IDs dos assets do MediaLibrary)
  └── capaMusicaId: string | null

@stats (Record<musicaId, EstatisticaMusica>)
  ├── nome: string
  ├── plays: number (total histórico)
  ├── segundos: number (total histórico)
  └── mensal: Record<"YYYY-MM", { plays: number, segundos: number }>

Estado em Memória (PlayerContext)
  ├── musicas: Array<{ id, nome, uri, duracao }>
  ├── filaAtual: Array<string>
  ├── indiceNaFila: number | null
  ├── capaAtual: string | null (Data URI base64)
  └── capasCache: Record<musicaId, string | null>