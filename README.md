# Gestão de Almoxarifado

Um site estático para gestão simples de almoxarifado, desenvolvido em HTML, CSS (Tailwind) e JavaScript puro. Utiliza localStorage para persistência de dados, sem necessidade de backend.

## Funcionalidades

- **Dashboard**: Resumo com totais, itens baixo estoque, entradas recentes e valor estimado (opcional).
- **Produtos**: Cadastro, edição, exclusão e busca por nome/código.
- **Movimentações**: Registro de entrada/saída com atualização automática do estoque.
- **Histórico**: Visualização de movimentações com filtros por data e tipo.
- **Relatórios**: Inventário atual, itens baixo estoque e movimentações por período (imprimível).
- **Etiquetas**: Geração de QR codes para produtos (opcional, usa QRCode.js).
- **Backup/Restore**: Exportar/importar dados em JSON.
- **Tema**: Claro/escuro opcional.

## Tecnologias

- HTML5
- CSS (Tailwind via CDN)
- JavaScript ES6
- localStorage para dados
- Bibliotecas via CDN: Toastify, JsBarcode, QRCode.js, FileSaver.js

## Publicação no GitHub Pages

1. Crie um repositório no GitHub (ex.: `almoxarifado`).
2. Clone o repositório localmente.
3. Copie os arquivos (`index.html`, `app.js`, `data/sample-data.json`) para o repositório.
4. Commit e push para o branch `main`.
5. No GitHub, vá para Settings > Pages, selecione branch `main` e salve.
6. O site estará disponível em `https://seuusuario.github.io/almoxarifado/`.

## Como Usar

1. Abra o site no navegador.
2. No primeiro acesso, os dados de exemplo serão carregados.
3. Navegue pelas seções via menu.
4. Adicione produtos no modal.
5. Registre movimentações.
6. Use busca para filtrar produtos.
7. Gere relatórios via impressão (Ctrl+P).

### Resetar Dados

- Para resetar: Abra console do navegador (F12) e execute `localStorage.removeItem('almoxarifado'); location.reload();`
- Ou use o botão Restore para carregar dados limpos.

### Exemplos de CSV para Import (opcional)

Se implementar import CSV, use estes formatos:

**Produtos (produtos.csv):**
```
id,nome,categoria,local,quantidade,unidade,estoque_minimo,fornecedor,preco_unitario,descricao
P001,Parafuso 4x20,Ferragens,A1,120,un,30,Fornecedor X,0.15,Pacote com 100 unidades
```

**Movimentações (movimentacoes.csv):**
```
id,produto_id,tipo,quantidade,motivo,documento,usuario,data
M0001,P001,entrada,50,Compra inicial,NF-001,Admin,2026-01-18T10:00:00Z
```

Para implementar import CSV, adicione um parser como PapaParse via CDN e botões no config.

## Testes Manuais

1. **Criar Produto**: Clique "Novo Produto", preencha campos, salve. Verifique na tabela.
2. **Registrar Saída**: Selecione produto, tipo saída, quantidade < estoque, registre. Verifique quantidade diminuiu.
3. **Exportar JSON**: Vá para Config, clique Backup, baixe arquivo.
4. **Importar de Volta**: Clique Restore, selecione arquivo baixado, confirme restauração.

## Desenvolvimento

Para modificar, edite `index.html`, `app.js` e `data/sample-data.json`. Dados são salvos em localStorage como JSON.

Comentários no JS explicam onde ler/salvar dados.
