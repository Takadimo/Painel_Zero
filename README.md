# Painel_Zero (Versão 0: Base Modular Inicial)

> **Painel Web de Estudos para Piano & Acordeon**  
> Focado em Prática Deliberada, Neurociência da Aprendizagem Motora e Alta Performance.

---

## 🎯 Objetivo da Versão 0

Esta é a fundação limpa e modular do projeto, desenhada para ser inserida diretamente no seu repositório do GitHub. Ela elimina a fragilidade do arquivo monolítico de 7.000 linhas, substituindo-o por uma arquitetura em 4 arquivos desacoplados e de fácil manutenção.

---

## 📁 Estrutura de Arquivos

```
painel-zero/
├── index.html       # Estrutura visual da SPA em Dark Mode com navegação por abas
├── state.js         # Single Source of Truth (SSOT), gerenciador de estado e Pub/Sub
├── repertoire.js    # Modelagem do repertório, microblocos (XX.Y.ZZ-WW) e Caixas Leitner
├── app.js           # Orquestrador de UI, cronômetro de foco e despachante de eventos
└── README.md        # Documentação técnica do projeto
```

---

## ⚙️ Diretrizes Técnicas Desta Versão

1. **Fonte Única da Verdade (SSOT)**: Todos os dados residem centralizados em `window.StateManager` com persistência reativa no `localStorage`.
2. **Delegação Global de Eventos**: 100% livre de atributos `onclick` inline. Todos os cliques são capturados centralmente no `app.js` através de atributos `data-action`.
3. **Zero Dependências Pesadas**: Código em JavaScript puro (Vanilla JS), HTML5 e CSS3 nativos.
4. **Execução Imediata**: Basta abrir o arquivo `index.html` com dois cliques em qualquer navegador.

---

## 🚀 Próximos Passos (Próximas Versões)

- **Versão 1**: Motor Leitner de 5 Caixas, Cálculo de IFM e Auditoria a Frio (Bloco A).
- **Versão 2**: Sessão Guiada 1-Clique com Desbloqueio Just-in-Time (Pipeline de 5 Blocos).
- **Versão 3**: Sessão Sanduíche com Drop-the-Prompt e Timer de Micro-Replay de 10s.
- **Versão 4**: Bloco Técnico no Círculo de Quintas e Leitura Faber 001-128.
- **Versão 5**: Gráficos SVG nativos (Pirâmide Leitner, Radar de Quintas, Heatmap de 4 Semanas).
- **Versão 6**: Sincronização em Nuvem (Google Apps Script) e Registro Offline.

