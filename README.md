# ConfyUI Lora Helper

Um aplicativo web para organizar e gerenciar seus Loras, Checkpoints e outros modelos do Civitai para uso com ConfyUI.

## 🚀 Funcionalidades

### ✨ Principais Recursos
- **Cadastro completo de modelos** com todas as informações importantes
- **Filtros inteligentes** por tipo, base model e busca textual
- **Sistema de favoritos** para marcar modelos importantes
- **Visualização detalhada** com trigger words, descrições e notas pessoais
- **Interface moderna** com Tailwind CSS e animações suaves
- **Armazenamento local** - seus dados ficam salvos no navegador
- **Responsivo** - funciona em desktop e mobile

### 📋 Campos Disponíveis
- **Informações básicas**: Nome, tipo, base model, versão
- **Links**: URL do Civitai, imagem do modelo
- **Configurações**: Peso recomendado, steps, CFG scale
- **Tags**: Categorização e palavras-chave
- **Trigger Words**: Palavras de ativação para o modelo
- **Descrição**: Informações sobre o modelo
- **Notas pessoais**: Suas observações e dicas de uso

### 🎯 Tipos de Modelo Suportados
- **LoRA** - Modelos LoRA para fine-tuning
- **Checkpoint** - Modelos completos de checkpoint
- **VAE** - Modelos VAE para codificação/decodificação
- **Textual Inversion** - Embeddings textuais
- **ControlNet** - Modelos de controle

## 🛠️ Como Usar

### 1. Primeira Execução
1. Abra o arquivo `index.html` no seu navegador
2. O app já vem com um modelo de exemplo (Yuzuha do Zenless Zone Zero)
3. Clique em "Adicionar Modelo" para começar a cadastrar seus próprios modelos

### 2. Adicionando Modelos
1. Clique no botão "Adicionar Modelo"
2. Preencha as informações do modelo:
   - **Nome**: Nome do modelo
   - **Tipo**: LoRA, Checkpoint, VAE, etc.
   - **Base Model**: SDXL, Illustrious, SD1.5, etc.
   - **URL do Civitai**: Link para a página do modelo
   - **Imagem**: URL da imagem do modelo (opcional)
   - **Trigger Words**: Palavras de ativação separadas por vírgula
   - **Descrição**: Informações sobre o modelo
   - **Notas pessoais**: Suas observações

### 3. Organizando sua Biblioteca
- **Filtros**: Use os filtros para encontrar modelos específicos
- **Busca**: Digite palavras-chave para encontrar modelos
- **Favoritos**: Marque modelos importantes com a estrela
- **Visualização**: Clique em "Ver" para ver todos os detalhes

### 4. Usando no ConfyUI
1. Abra os detalhes do modelo
2. Copie as trigger words clicando no botão "Copiar"
3. Cole no seu prompt do ConfyUI
4. Use as configurações recomendadas (peso, steps, CFG)

## 📱 Interface

### Dashboard Principal
- **Cards dos modelos** com imagem, nome e tags
- **Estatísticas** em tempo real (total, LoRAs, Checkpoints, favoritos)
- **Filtros** para organizar sua biblioteca
- **Busca** por nome, tags ou trigger words

### Modal de Detalhes
- **Imagem completa** do modelo
- **Todas as informações** organizadas
- **Botão de copiar** trigger words
- **Link direto** para o Civitai
- **Notas pessoais** para suas observações

## 💾 Armazenamento

- Todos os dados são salvos no **localStorage** do navegador
- Não há necessidade de servidor ou banco de dados
- Seus dados ficam salvos localmente no seu computador
- Para backup, você pode exportar os dados do localStorage

## 🎨 Personalização

### Cores e Estilo
- Interface moderna com gradientes roxos e azuis
- Animações suaves e transições
- Design responsivo para mobile e desktop
- Ícones do Font Awesome

### Funcionalidades Extras
- **Notificações** para ações importantes
- **Animações** nos cards e modais
- **Hover effects** para melhor UX
- **Loading states** para operações

## 🔧 Tecnologias

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos customizados e animações
- **Tailwind CSS** - Framework CSS utilitário
- **JavaScript ES6+** - Funcionalidades interativas
- **Font Awesome** - Ícones
- **LocalStorage** - Armazenamento local

## 📁 Estrutura do Projeto

```
confyui-lora-helper/
├── index.html          # Página principal
├── styles.css          # Estilos customizados
├── script.js           # Lógica JavaScript
└── README.md           # Este arquivo
```

## 🚀 Como Executar

### Opção 1: Execução Direta
1. **Download**: Baixe todos os arquivos para uma pasta
2. **Abrir**: Clique duas vezes no arquivo `index.html`
3. **Usar**: O app abrirá no seu navegador padrão

### Opção 2: Servidor Local (Recomendado)
1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Executar servidor local**:
   ```bash
   npm start
   ```

3. **Acessar**: O app abrirá automaticamente em `http://localhost:3000`

### Opção 3: Qualquer servidor HTTP
- Coloque os arquivos em qualquer servidor web (Apache, Nginx, etc.)
- Acesse através do navegador

## 💡 Dicas de Uso

### Para ConfyUI
1. **Organize por tipo**: Use os filtros para separar LoRAs de Checkpoints
2. **Mantenha trigger words**: Sempre copie as trigger words corretas
3. **Anote configurações**: Use as notas pessoais para lembrar de settings específicos
4. **Favoritos**: Marque os modelos que você mais usa

### Para Produtividade
1. **Tags consistentes**: Use tags padronizadas (anime, character, woman, etc.)
2. **Descrições detalhadas**: Anote dicas de uso e observações
3. **URLs do Civitai**: Mantenha os links para referência futura
4. **Backup regular**: Exporte seus dados periodicamente

## 🤝 Contribuições

Este é um projeto pessoal, mas sugestões são bem-vindas! Se você quiser melhorar o app, pode:

- Adicionar funcionalidades de exportação/importação
- Implementar categorias customizadas
- Adicionar sistema de ratings
- Criar templates de prompt
- Adicionar suporte a múltiplos idiomas

## 📝 Licença

Este projeto é de uso livre. Sinta-se à vontade para modificar e usar como quiser!

---

**Desenvolvido para facilitar a organização de modelos do Civitai para ConfyUI** 🎨✨ 