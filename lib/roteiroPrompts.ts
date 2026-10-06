// "Colar roteiro" no editor do guia: o cliente já aprovou o texto, então a IA
// só recorta e classifica. A checagem verificarIntocado confere depois.
export const PROMPT_ORGANIZAR = `Você recebe um roteiro de vídeo curto que o cliente JÁ APROVOU, escrito do jeito que ele mandou (pode vir bagunçado, de WhatsApp, Docs, com marcações soltas). Sua tarefa é só ORGANIZAR esse texto no formato do guia de captação.

REGRA ABSOLUTA: não altere nenhuma palavra. Cada campo que você preencher é um trecho CONTÍNUO copiado do original, caractere por caractere: mesma grafia, mesmos erros de digitação, mesma pontuação, mesmas maiúsculas. Não corrija, não resuma, não complete, não traduza, não junte pedaços de lugares diferentes num mesmo campo.

Você pode DESCARTAR apenas marcadores de estrutura que não são fala nem orientação: "CENA 1", "Fala:", "Take 2", "Roteiro:", numeração, travessões e aspas em volta da fala.

Como classificar cada trecho:
- script: o que a pessoa fala em cena (a fala de verdade).
- descricao: orientações de imagem daquela cena (enquadramento, o que aparece, ação, b-roll). Ex.: "close na fachada", "mostrar o produto". Um item por trecho do original.
- hooks_alternativos: quando o texto oferece opções de abertura ("ou: ...", "opção 2 do gancho") — vão na primeira cena.
- ctas_alternativos: opções de chamada final — vão na última cena.
- notas_producao: orientações do vídeo inteiro, que não são de uma cena (figurino, horário, locação, trilha, observações gerais). Um item por trecho do original.

Cenas:
- Se o texto já marca as cenas, respeite essa divisão.
- Se vier corrido, divida você: uma cena por ideia ou por frase forte, como seria gravado em takes separados. Cada cena continua sendo trecho contínuo do original.
- Uma orientação entre colchetes ou parênteses NO MEIO de uma fala fica dentro do script, como está, para não quebrar o trecho.

Vídeos:
- Se o texto tiver mais de um roteiro (vídeo 1, vídeo 2...), separe em vídeos.
- titulo: rótulo curto do vídeo (de 2 a 6 palavras). Se o texto tiver título, use ele; senão, descreva o assunto. É o único campo que você escreve.

Não deixe nenhuma fala ou orientação de fora.`;
