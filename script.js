// ConfyUI Lora Helper - Main JavaScript

class LoraHelper {
    constructor() {
        this.models = JSON.parse(localStorage.getItem('loraHelperModels')) || [];
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderModels();
        this.updateStats();
        this.addSampleData();
    }

    setupEventListeners() {
        // Add model button
        document.getElementById('addModelBtn').addEventListener('click', () => this.openModal());
        document.getElementById('addFirstModel').addEventListener('click', () => this.openModal());

        // Quick actions
        document.getElementById('createPromptBtn').addEventListener('click', () => this.openPromptBuilder());
        document.getElementById('useTemplateBtn').addEventListener('click', () => this.openTemplateSelector());
        document.getElementById('viewHistoryBtn').addEventListener('click', () => this.openHistory());

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('modelForm').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Detail modal
        document.getElementById('closeDetailModal').addEventListener('click', () => this.closeDetailModal());

        // Filters
        document.getElementById('typeFilter').addEventListener('change', () => this.filterModels());
        document.getElementById('baseModelFilter').addEventListener('change', () => this.filterModels());
        document.getElementById('searchInput').addEventListener('input', () => this.filterModels());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());

        // Close modals on outside click
        document.getElementById('modelModal').addEventListener('click', (e) => {
            if (e.target.id === 'modelModal') this.closeModal();
        });
        document.getElementById('detailModal').addEventListener('click', (e) => {
            if (e.target.id === 'detailModal') this.closeDetailModal();
        });

        // Civitai URL input listener
        document.getElementById('civitaiUrl').addEventListener('blur', () => this.handleCivitaiUrlChange());
        
        // Fetch Civitai button
        document.getElementById('fetchCivitaiBtn').addEventListener('click', () => {
            const url = document.getElementById('civitaiUrl').value.trim();
            if (url && url.includes('civitai.com/models/')) {
                const modelId = this.extractModelId(url);
                if (modelId) {
                    this.fetchModelFromCivitai(modelId);
                } else {
                    this.showNotification('URL inválida. Verifique o link do Civitai.', 'error');
                }
            } else {
                this.showNotification('Por favor, insira uma URL válida do Civitai.', 'error');
            }
        });
    }

    // Extract model ID from Civitai URL
    extractModelId(url) {
        const match = url.match(/civitai\.com\/models\/(\d+)/);
        return match ? match[1] : null;
    }

    // Handle Civitai URL input change
    handleCivitaiUrlChange() {
        const urlInput = document.getElementById('civitaiUrl');
        const url = urlInput.value.trim();
        
        if (url && url.includes('civitai.com/models/')) {
            const modelId = this.extractModelId(url);
            if (modelId) {
                this.fetchModelFromCivitai(modelId);
            }
        }
    }

    // Debug function to test Civitai API
    async debugCivitaiAPI(modelId) {
        try {
            console.log(`Testing Civitai API for model ID: ${modelId}`);
            const response = await fetch(`https://civitai.com/api/v1/models/${modelId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Full API Response:', data);
            console.log('Model Name:', data.name);
            console.log('Model Type:', data.type);
            console.log('Base Model (direct):', data.baseModel);
            console.log('Tags:', data.tags);
            console.log('Model Versions:', data.modelVersions);
            console.log('First Version:', data.modelVersions?.[0]);
            console.log('First Version Base Model:', data.modelVersions?.[0]?.baseModel);
            console.log('First Version Files:', data.modelVersions?.[0]?.files);
            console.log('First File Metadata:', data.modelVersions?.[0]?.files?.[0]?.metadata);
            console.log('Trained Words:', data.modelVersions?.[0]?.trainedWords);
            
            // Check for base model in different locations
            const possibleBaseModels = [
                data.baseModel,
                data.modelVersions?.[0]?.baseModel,
                data.modelVersions?.[0]?.files?.[0]?.metadata?.baseModel
            ].filter(Boolean);
            
            console.log('Possible Base Models found:', possibleBaseModels);
            
            return data;
        } catch (error) {
            console.error('Error testing API:', error);
            throw error;
        }
    }

    // Try to extract base model from Civitai HTML page as fallback
    async extractBaseModelFromHTML(modelId) {
        try {
            console.log('Attempting to extract base model from HTML page...');
            const response = await fetch(`https://civitai.com/models/${modelId}`);
            const html = await response.text();
            
            // Look for base model in the HTML using more specific patterns
            const baseModelPatterns = [
                // Look for the specific element structure you mentioned
                /<p[^>]*class="[^"]*mantine-Text-root[^"]*"[^>]*>([^<]*illustrious[^<]*)<\/p>/i,
                /<p[^>]*class="[^"]*mantine-Text-root[^"]*"[^>]*>([^<]*sdxl[^<]*)<\/p>/i,
                /<p[^>]*class="[^"]*mantine-Text-root[^"]*"[^>]*>([^<]*sd 1\.5[^<]*)<\/p>/i,
                /<p[^>]*class="[^"]*mantine-Text-root[^"]*"[^>]*>([^<]*sd 2\.1[^<]*)<\/p>/i,
                // More general patterns
                /Base Model[^>]*>([^<]+)</i,
                /base model[^>]*>([^<]+)</i,
                /illustrious/i,
                /sdxl/i,
                /sd 1\.5/i,
                /sd 2\.1/i
            ];
            
            for (const pattern of baseModelPatterns) {
                const match = html.match(pattern);
                if (match) {
                    const found = match[1] || match[0];
                    console.log('Found base model in HTML:', found);
                    
                    // Clean up the found text
                    let baseModel = found.trim();
                    if (baseModel.toLowerCase().includes('illustrious')) {
                        return 'Illustrious';
                    } else if (baseModel.toLowerCase().includes('sdxl')) {
                        return 'SDXL';
                    } else if (baseModel.toLowerCase().includes('sd 1.5')) {
                        return 'SD 1.5';
                    } else if (baseModel.toLowerCase().includes('sd 2.1')) {
                        return 'SD 2.1';
                    }
                    
                    return baseModel;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error extracting from HTML:', error);
            return null;
        }
    }

    // Fetch model data from Civitai API
    async fetchModelFromCivitai(modelId) {
        const loadingBtn = document.getElementById('fetchCivitaiBtn');
        const originalText = loadingBtn ? loadingBtn.innerHTML : '';
        
        try {
            if (loadingBtn) {
                loadingBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Buscando...';
                loadingBtn.disabled = true;
            }
            
            // First, debug the API response
            const data = await this.debugCivitaiAPI(modelId);
            
            // If no base model found in API, try HTML extraction
            if (!data.baseModel && !data.modelVersions?.[0]?.baseModel) {
                console.log('No base model found in API, trying HTML extraction...');
                const htmlBaseModel = await this.extractBaseModelFromHTML(modelId);
                if (htmlBaseModel) {
                    console.log('Base model found in HTML:', htmlBaseModel);
                    // Add the base model to the data
                    data.baseModel = htmlBaseModel;
                }
            }
            
            this.populateFormFromCivitai(data);
            this.showNotification('Informações carregadas do Civitai!', 'success');
            
        } catch (error) {
            console.error('Erro ao buscar modelo:', error);
            this.showNotification('Erro ao buscar modelo no Civitai. Verifique o link.', 'error');
        } finally {
            if (loadingBtn) {
                loadingBtn.innerHTML = originalText;
                loadingBtn.disabled = false;
            }
        }
    }

    // Populate form with data from Civitai
    populateFormFromCivitai(modelData) {
        console.log('Civitai API Response:', modelData); // Debug log
        
        // Basic information
        document.getElementById('modelName').value = modelData.name || '';
        document.getElementById('modelType').value = this.mapCivitaiType(modelData.type) || '';
        
        // Better base model detection - check multiple sources
        let baseModel = '';
        
        // 1. Check direct baseModel field
        if (modelData.baseModel) {
            baseModel = modelData.baseModel;
        }
        // 2. Check in model versions
        else if (modelData.modelVersions?.[0]?.baseModel) {
            baseModel = modelData.modelVersions[0].baseModel;
        }
        // 3. Check in model version files
        else if (modelData.modelVersions?.[0]?.files?.[0]?.metadata?.baseModel) {
            baseModel = modelData.modelVersions[0].files[0].metadata.baseModel;
        }
        // 4. Check in description or name for common patterns
        else {
            const description = modelData.description || '';
            const name = modelData.name || '';
            
            // Look for specific patterns in description
            if (description.toLowerCase().includes('illustrious')) {
                baseModel = 'Illustrious';
            } else if (description.toLowerCase().includes('sdxl')) {
                baseModel = 'SDXL';
            } else if (description.toLowerCase().includes('sd 1.5')) {
                baseModel = 'SD 1.5';
            } else if (description.toLowerCase().includes('sd 2.1')) {
                baseModel = 'SD 2.1';
            } else if (name.toLowerCase().includes('illustrious')) {
                baseModel = 'Illustrious';
            } else if (name.toLowerCase().includes('sdxl')) {
                baseModel = 'SDXL';
            } else if (name.toLowerCase().includes('sd 1.5')) {
                baseModel = 'SD 1.5';
            } else if (name.toLowerCase().includes('sd 2.1')) {
                baseModel = 'SD 2.1';
            } else {
                // Default based on model type
                if (modelData.type === 'Checkpoint') {
                    baseModel = 'SD 1.5';
                } else if (modelData.type === 'LoRA') {
                    baseModel = 'SDXL'; // Most LoRAs are for SDXL nowadays
                } else {
                    baseModel = 'SD 1.5';
                }
            }
        }
        
        console.log('Detected Base Model:', baseModel);
        document.getElementById('baseModel').value = baseModel;
        
        // Get version from first model version
        const firstVersion = modelData.modelVersions?.[0];
        document.getElementById('version').value = firstVersion?.name || '';
        document.getElementById('civitaiUrl').value = `https://civitai.com/models/${modelData.id}`;
        
        // Get first image from first version
        if (firstVersion?.images?.[0]) {
            const imageUrl = `https://image.civitai.com/xG1nkqKTMzGDvpLrXFTSTA/${firstVersion.images[0].url}`;
            document.getElementById('imageUrl').value = imageUrl;
        }
        
        // Tags - handle different possible structures
        let tags = [];
        
        // Try to get tags from the model data
        if (modelData.tags && Array.isArray(modelData.tags)) {
            tags = modelData.tags.map(tag => {
                if (typeof tag === 'string') return tag;
                if (tag && typeof tag === 'object') {
                    return tag.name || tag.id || tag.value || '';
                }
                return '';
            }).filter(tag => tag);
        }
        
        // If no tags found, try to extract from trained words
        if (tags.length === 0 && firstVersion?.trainedWords) {
            // Filter out trigger words and keep only descriptive tags
            tags = firstVersion.trainedWords
                .filter(word => {
                    // Skip trigger words (usually in parentheses or very specific)
                    if (word.includes('(') || word.includes(')') || word.length < 3) return false;
                    if (word.includes('1girl') || word.includes('1boy')) return false;
                    if (word.includes('breasts') || word.includes('eyes') || word.includes('hair')) return false;
                    return true;
                })
                .slice(0, 10); // Limit to first 10 tags
        }
        
        // If still no tags, try to extract from description
        if (tags.length === 0 && modelData.description) {
            const description = modelData.description.toLowerCase();
            const commonTags = ['anime', 'character', 'woman', 'man', 'girl', 'boy', 'portrait', 'realistic', 'fantasy', 'scifi'];
            tags = commonTags.filter(tag => description.includes(tag));
        }
        
        if (tags.length > 0) {
            document.getElementById('tags').value = tags.join(', ');
        }
        
        // Description with HTML formatting preserved
        if (modelData.description) {
            // Keep HTML formatting but clean up some problematic tags
            let description = modelData.description
                .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
                .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove styles
                .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
                .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
                .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
                .trim();
            
            document.getElementById('description').value = description;
        }
        
        // Trigger words from first version
        if (firstVersion?.trainedWords && Array.isArray(firstVersion.trainedWords)) {
            document.getElementById('triggerWords').value = firstVersion.trainedWords.join(', ');
        }
        
        // Extract usage recommendations from description
        const usageRecommendations = this.extractUsageRecommendations(modelData.description || '');
        document.getElementById('usageRecommendations').value = usageRecommendations;
        
        // Personal notes with model info and usage recommendations
        let notes = `Modelo ID: ${modelData.id}\nDownloads: ${modelData.downloadCount || 0}\nRating: ${modelData.rating || 0}/5\n\n`;
        
        notes += `=== SUAS OBSERVAÇÕES ===\nAdicione suas observações pessoais aqui...`;
        document.getElementById('personalNotes').value = notes;
        
        // Auto-fill recommended settings if found
        this.extractAndFillSettings(modelData.description || '');
        
        // Show success notification with debug info
        console.log('Extracted data:', {
            name: modelData.name,
            type: modelData.type,
            baseModel: baseModel,
            tags: tags,
            version: firstVersion?.name,
            triggerWords: firstVersion?.trainedWords
        });
    }

    // Extract usage recommendations from description
    extractUsageRecommendations(description) {
        const recommendations = [];
        
        // Common patterns for usage recommendations
        const patterns = [
            /sampler\s*=\s*([^,\n]+)/gi,
            /cfg\s*scale\s*[=:]\s*([^,\n]+)/gi,
            /steps\s*[=:]\s*([^,\n]+)/gi,
            /denoising\s*strength\s*[=:]\s*([^,\n]+)/gi,
            /clip\s*skip\s*[=:]\s*([^,\n]+)/gi,
            /hires\s*fix[^,\n]*/gi,
            /upscale[^,\n]*/gi
        ];
        
        patterns.forEach(pattern => {
            const matches = description.match(pattern);
            if (matches) {
                recommendations.push(...matches);
            }
        });
        
        // Look for specific recommendation sections
        const recommendationSections = [
            /recommendations?[^]*?(?=\n\n|\n[A-Z]|$)/gi,
            /how\s*to\s*use[^]*?(?=\n\n|\n[A-Z]|$)/gi,
            /usage[^]*?(?=\n\n|\n[A-Z]|$)/gi,
            /settings[^]*?(?=\n\n|\n[A-Z]|$)/gi
        ];
        
        recommendationSections.forEach(pattern => {
            const matches = description.match(pattern);
            if (matches) {
                recommendations.push(...matches);
            }
        });
        
        return recommendations.length > 0 ? recommendations.join('\n') : '';
    }

    // Extract and fill recommended settings
    extractAndFillSettings(description) {
        // Extract CFG Scale
        const cfgMatch = description.match(/cfg\s*scale\s*[=:]\s*([0-9.,\-\s]+)/i);
        if (cfgMatch) {
            document.getElementById('cfgScale').value = cfgMatch[1].trim();
        }
        
        // Extract Steps
        const stepsMatch = description.match(/steps\s*[=:]\s*([0-9.,\-\s]+)/i);
        if (stepsMatch) {
            document.getElementById('recommendedSteps').value = stepsMatch[1].trim();
        }
        
        // Extract Sampler recommendations
        const samplerMatch = description.match(/sampler\s*=\s*([^,\n]+)/i);
        if (samplerMatch) {
            const currentNotes = document.getElementById('personalNotes').value;
            const samplerInfo = `Sampler Recomendado: ${samplerMatch[1].trim()}`;
            document.getElementById('personalNotes').value = currentNotes.replace(
                '=== RECOMENDAÇÕES DE USO ===',
                `=== RECOMENDAÇÕES DE USO ===\n${samplerInfo}`
            );
        }
    }

    // Map Civitai model type to our types
    mapCivitaiType(civitaiType) {
        const typeMap = {
            'Checkpoint': 'Checkpoint',
            'LoRA': 'LoRA',
            'VAE': 'VAE',
            'TextualInversion': 'TextualInversion',
            'ControlNet': 'ControlNet',
            'Hypernetwork': 'Hypernetwork',
            'AestheticGradient': 'AestheticGradient',
            'LORA': 'LoRA',
            'CHECKPOINT': 'Checkpoint'
        };
        return typeMap[civitaiType] || 'LoRA';
    }

    // Clean HTML from description
    cleanHtml(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    }

    addSampleData() {
        if (this.models.length === 0) {
            const sampleModel = {
                id: Date.now(),
                name: "Yuzuha Ukinami 浮波柚葉 | Zenless Zone Zero",
                type: "LoRA",
                baseModel: "Illustrious",
                version: "v1.0",
                civitaiUrl: "https://civitai.com/models/1743952/yuzuha-ukinami-zenless-zone-zero",
                imageUrl: "https://image.civitai.com/xG1nkqKTMzGDvpLrXFTSTA/8498.png",
                recommendedWeight: 1.0,
                recommendedSteps: "20-30",
                cfgScale: "7-8",
                tags: "anime, character, woman, game character, girls, video game",
                triggerWords: "yuzuh4, medium breasts, green eyes, red hair, ahoge, blunt bangs, very long hair, low twintails, twin braids, hair ornament, hair bobbles, hair bow, white bow, black choker, white bowtie, shoulder strap, black armband, pink cardigan, long sleeves, black sailor collar, black serafuku, pleated skirt, two-tone skirt, layered skirt, black skirt, red skirt, thigh strap, asymmetrical legwear, striped thighhighs, two-tone thighhighs, white thighhighs, grey thighhighs, loose thighhigh, black boots, high heel boots, holding umbrella, red umbrella",
                description: "Yuzuha Ukinami character from Zenless Zone Zero. Best weight: 1.0. Features detailed outfit with multiple clothing elements and accessories.",
                personalNotes: "Excelente para personagens femininas com cabelo vermelho e olhos verdes. Funciona muito bem com o Illustrious XL.",
                isFavorite: true,
                createdAt: new Date().toISOString()
            };
            this.models.push(sampleModel);
            this.saveModels();
            this.renderModels();
            this.updateStats();
        }
    }

    openModal(modelId = null) {
        this.currentEditId = modelId;
        const modal = document.getElementById('modelModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('modelForm');

        if (modelId) {
            const model = this.models.find(m => m.id === modelId);
            if (model) {
                title.textContent = 'Editar Modelo';
                this.populateForm(model);
            }
        } else {
            title.textContent = 'Adicionar Novo Modelo';
            form.reset();
        }

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('modelModal').classList.add('hidden');
        document.body.style.overflow = 'auto';
        this.currentEditId = null;
    }

    populateForm(model) {
        document.getElementById('modelName').value = model.name || '';
        document.getElementById('modelType').value = model.type || '';
        document.getElementById('baseModel').value = model.baseModel || '';
        document.getElementById('version').value = model.version || '';
        document.getElementById('civitaiUrl').value = model.civitaiUrl || '';
        document.getElementById('imageUrl').value = model.imageUrl || '';
        document.getElementById('recommendedWeight').value = model.recommendedWeight || '';
        document.getElementById('recommendedSteps').value = model.recommendedSteps || '';
        document.getElementById('cfgScale').value = model.cfgScale || '';
        document.getElementById('tags').value = model.tags || '';
        document.getElementById('triggerWords').value = model.triggerWords || '';
        document.getElementById('description').value = model.description || '';
        document.getElementById('usageRecommendations').value = model.usageRecommendations || '';
        document.getElementById('personalNotes').value = model.personalNotes || '';
        document.getElementById('isFavorite').checked = model.isFavorite || false;
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const modelData = {
            id: this.currentEditId || Date.now(),
            name: formData.get('modelName') || document.getElementById('modelName').value,
            type: formData.get('modelType') || document.getElementById('modelType').value,
            baseModel: document.getElementById('baseModel').value,
            version: document.getElementById('version').value,
            civitaiUrl: document.getElementById('civitaiUrl').value,
            imageUrl: document.getElementById('imageUrl').value,
            recommendedWeight: parseFloat(document.getElementById('recommendedWeight').value) || null,
            recommendedSteps: document.getElementById('recommendedSteps').value,
            cfgScale: document.getElementById('cfgScale').value,
            tags: document.getElementById('tags').value,
            triggerWords: document.getElementById('triggerWords').value,
            description: document.getElementById('description').value,
            usageRecommendations: document.getElementById('usageRecommendations').value,
            personalNotes: document.getElementById('personalNotes').value,
            isFavorite: document.getElementById('isFavorite').checked,
            createdAt: this.currentEditId ? 
                this.models.find(m => m.id === this.currentEditId)?.createdAt || new Date().toISOString() :
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.currentEditId) {
            const index = this.models.findIndex(m => m.id === this.currentEditId);
            if (index !== -1) {
                this.models[index] = modelData;
            }
        } else {
            this.models.push(modelData);
        }

        this.saveModels();
        this.renderModels();
        this.updateStats();
        this.closeModal();
        this.showNotification('Modelo salvo com sucesso!', 'success');
    }

    renderModels() {
        const grid = document.getElementById('modelsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (this.models.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        
        const filteredModels = this.getFilteredModels();
        
        if (filteredModels.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">Nenhum modelo encontrado</h3>
                    <p class="text-gray-500">Tente ajustar os filtros de busca.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredModels.map(model => this.createModelCard(model)).join('');
    }

    createModelCard(model) {
        const typeClass = model.type.toLowerCase().replace(/\s+/g, '');
        const tags = model.tags ? model.tags.split(',').slice(0, 3) : [];
        
        return `
            <div class="model-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200">
                <div class="relative">
                    ${model.imageUrl ? 
                        `<img src="${model.imageUrl}" alt="${model.name}" class="w-full h-48 object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                        ''
                    }
                    <div class="image-placeholder w-full h-48 ${model.imageUrl ? 'hidden' : ''}">
                        <i class="fas fa-image"></i>
                    </div>
                    
                    <div class="absolute top-2 left-2">
                        <span class="type-badge ${typeClass}">${model.type}</span>
                    </div>
                    
                    <button onclick="app.toggleFavorite(${model.id})" class="absolute top-2 right-2 favorite-star">
                        <i class="fas fa-star ${model.isFavorite ? 'text-yellow-400' : 'text-gray-300'}"></i>
                    </button>
                </div>
                
                <div class="p-4">
                    <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2" title="${model.name}">${model.name}</h3>
                    
                    ${model.baseModel ? `<p class="text-sm text-gray-600 mb-2">${model.baseModel}</p>` : ''}
                    
                    <!-- Quick Info for ConfyUI -->
                    <div class="mb-3 space-y-1">
                        ${model.recommendedWeight ? `<div class="text-xs text-gray-500"><i class="fas fa-weight-hanging mr-1"></i>Peso: ${model.recommendedWeight}</div>` : ''}
                        ${model.recommendedSteps ? `<div class="text-xs text-gray-500"><i class="fas fa-layer-group mr-1"></i>Steps: ${model.recommendedSteps}</div>` : ''}
                        ${model.cfgScale ? `<div class="text-xs text-gray-500"><i class="fas fa-sliders-h mr-1"></i>CFG: ${model.cfgScale}</div>` : ''}
                    </div>
                    
                    ${tags.length > 0 ? `
                        <div class="mb-3">
                            ${tags.map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                            ${model.tags.split(',').length > 3 ? `<span class="tag">+${model.tags.split(',').length - 3}</span>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="flex justify-between items-center">
                        <div class="flex space-x-2">
                            <button onclick="app.viewDetails(${model.id})" class="text-purple-600 hover:text-purple-800 text-sm font-medium">
                                <i class="fas fa-eye mr-1"></i>Ver
                            </button>
                            <button onclick="app.quickPrompt(${model.id})" class="text-green-600 hover:text-green-800 text-sm font-medium">
                                <i class="fas fa-bolt mr-1"></i>Prompt
                            </button>
                            <button onclick="app.openModal(${model.id})" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                <i class="fas fa-edit mr-1"></i>Editar
                            </button>
                        </div>
                        <button onclick="app.deleteModel(${model.id})" class="text-red-600 hover:text-red-800 text-sm font-medium">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getFilteredModels() {
        let filtered = [...this.models];
        
        const typeFilter = document.getElementById('typeFilter').value;
        const baseModelFilter = document.getElementById('baseModelFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        if (typeFilter) {
            filtered = filtered.filter(model => model.type === typeFilter);
        }
        
        if (baseModelFilter) {
            filtered = filtered.filter(model => model.baseModel === baseModelFilter);
        }
        
        if (searchTerm) {
            filtered = filtered.filter(model => 
                model.name.toLowerCase().includes(searchTerm) ||
                model.tags?.toLowerCase().includes(searchTerm) ||
                model.triggerWords?.toLowerCase().includes(searchTerm) ||
                model.description?.toLowerCase().includes(searchTerm)
            );
        }
        
        return filtered.sort((a, b) => {
            // Favorites first, then by name
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return a.name.localeCompare(b.name);
        });
    }

    filterModels() {
        this.renderModels();
    }

    clearFilters() {
        document.getElementById('typeFilter').value = '';
        document.getElementById('baseModelFilter').value = '';
        document.getElementById('searchInput').value = '';
        this.renderModels();
    }

    toggleFavorite(modelId) {
        const model = this.models.find(m => m.id === modelId);
        if (model) {
            model.isFavorite = !model.isFavorite;
            this.saveModels();
            this.renderModels();
            this.updateStats();
        }
    }

    viewDetails(modelId) {
        const model = this.models.find(m => m.id === modelId);
        if (!model) return;

        const modal = document.getElementById('detailModal');
        const title = document.getElementById('detailTitle');
        const content = document.getElementById('detailContent');

        title.textContent = model.name;
        
        content.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    ${model.imageUrl ? 
                        `<img src="${model.imageUrl}" alt="${model.name}" class="w-full rounded-lg shadow-md" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                        ''
                    }
                    <div class="image-placeholder w-full h-64 rounded-lg ${model.imageUrl ? 'hidden' : ''}">
                        <i class="fas fa-image"></i>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <span class="type-badge ${model.type.toLowerCase().replace(/\s+/g, '')}">${model.type}</span>
                        <button onclick="app.toggleFavorite(${model.id})" class="favorite-star">
                            <i class="fas fa-star ${model.isFavorite ? 'text-yellow-400' : 'text-gray-300'}"></i>
                        </button>
                    </div>
                    
                    ${model.baseModel ? `<p><strong>Base Model:</strong> ${model.baseModel}</p>` : ''}
                    ${model.version ? `<p><strong>Versão:</strong> ${model.version}</p>` : ''}
                    ${model.recommendedWeight ? `<p><strong>Peso Recomendado:</strong> ${model.recommendedWeight}</p>` : ''}
                    ${model.recommendedSteps ? `<p><strong>Steps:</strong> ${model.recommendedSteps}</p>` : ''}
                    ${model.cfgScale ? `<p><strong>CFG Scale:</strong> ${model.cfgScale}</p>` : ''}
                    
                    ${model.civitaiUrl ? `
                        <div class="flex items-center space-x-2">
                            <a href="${model.civitaiUrl}" target="_blank" class="text-purple-600 hover:text-purple-800">
                                <i class="fas fa-external-link-alt mr-1"></i>Ver no Civitai
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            ${model.tags ? `
                <div class="mt-6">
                    <h4 class="font-semibold text-gray-900 mb-2">Tags</h4>
                    <div class="flex flex-wrap gap-2">
                        ${model.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${model.triggerWords ? `
                <div class="mt-6">
                    <h4 class="font-semibold text-gray-900 mb-2">Trigger Words</h4>
                    <div class="bg-gray-50 p-3 rounded-lg">
                        <p class="text-sm text-gray-700 mb-2">${model.triggerWords}</p>
                        <button onclick="app.copyToClipboard('${model.triggerWords.replace(/'/g, "\\'")}')" class="copy-btn">
                            <i class="fas fa-copy mr-1"></i>Copiar
                        </button>
                    </div>
                </div>
            ` : ''}
            
            ${model.description ? `
                <div class="mt-6">
                    <h4 class="font-semibold text-gray-900 mb-2">Descrição</h4>
                    <div class="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <div class="prose prose-sm max-w-none">
                            ${this.formatDescriptionForDisplay(model.description)}
                        </div>
                    </div>
                </div>
            ` : ''}
            
            ${model.usageRecommendations ? `
                <div class="mt-6">
                    <h4 class="font-semibold text-gray-900 mb-2">Recomendações de Uso</h4>
                    <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                        <pre class="text-sm text-gray-700 whitespace-pre-wrap">${model.usageRecommendations}</pre>
                    </div>
                </div>
            ` : ''}
            
            ${model.personalNotes ? `
                <div class="mt-6">
                    <h4 class="font-semibold text-gray-900 mb-2">Notas Pessoais</h4>
                    <p class="text-gray-700">${model.personalNotes}</p>
                </div>
            ` : ''}
            
            <div class="mt-6 pt-6 border-t border-gray-200">
                <div class="flex justify-between items-center text-sm text-gray-500">
                    <span>Criado em: ${new Date(model.createdAt).toLocaleDateString('pt-BR')}</span>
                    ${model.updatedAt ? `<span>Atualizado em: ${new Date(model.updatedAt).toLocaleDateString('pt-BR')}</span>` : ''}
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeDetailModal() {
        document.getElementById('detailModal').classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    deleteModel(modelId) {
        if (confirm('Tem certeza que deseja excluir este modelo?')) {
            this.models = this.models.filter(m => m.id !== modelId);
            this.saveModels();
            this.renderModels();
            this.updateStats();
            this.showNotification('Modelo excluído com sucesso!', 'success');
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Copiado para a área de transferência!', 'success');
        }).catch(() => {
            this.showNotification('Erro ao copiar texto', 'error');
        });
    }

    updateStats() {
        const total = this.models.length;
        const loras = this.models.filter(m => m.type === 'LoRA').length;
        const checkpoints = this.models.filter(m => m.type === 'Checkpoint').length;
        const favorites = this.models.filter(m => m.isFavorite).length;

        document.getElementById('totalCount').textContent = total;
        document.getElementById('loraCount').textContent = loras;
        document.getElementById('checkpointCount').textContent = checkpoints;
        document.getElementById('favoriteCount').textContent = favorites;
    }

    saveModels() {
        localStorage.setItem('loraHelperModels', JSON.stringify(this.models));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Helper to format description for display in the detail modal
    formatDescriptionForDisplay(description) {
        if (!description) return '';
        // Keep HTML formatting but clean up some problematic tags
        let formattedDescription = description
            .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
            .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove styles
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
            .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
            .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
            .trim();
        return formattedDescription;
    }

    // Quick prompt for a specific model
    quickPrompt(modelId) {
        const model = this.models.find(m => m.id === modelId);
        if (!model) return;
        
        this.openPromptBuilder([model]);
    }

    // Open prompt builder modal
    openPromptBuilder(selectedModels = []) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-2xl font-bold text-gray-900">Construtor de Prompt</h2>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Model Selection -->
                        <div>
                            <h3 class="font-semibold text-gray-900 mb-4">Selecionar Modelos</h3>
                            <div class="space-y-2 max-h-64 overflow-y-auto">
                                ${this.models.map(model => `
                                    <div class="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                                        <input type="checkbox" id="model-${model.id}" value="${model.id}" 
                                               ${selectedModels.some(m => m.id === model.id) ? 'checked' : ''}
                                               class="mr-3">
                                        <div class="flex-1">
                                            <div class="font-medium text-sm">${model.name}</div>
                                            <div class="text-xs text-gray-500">${model.type} - ${model.baseModel || 'N/A'}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Prompt Builder -->
                        <div>
                            <h3 class="font-semibold text-gray-900 mb-4">Configurar Prompt</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Prompt Base</label>
                                    <textarea id="basePrompt" rows="4" placeholder="Digite seu prompt base aqui..."
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Negative Prompt</label>
                                    <textarea id="negativePrompt" rows="3" placeholder="Digite seu negative prompt aqui..."
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Steps</label>
                                        <input type="number" id="promptSteps" value="20" min="1" max="100"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">CFG Scale</label>
                                        <input type="number" id="promptCFG" value="7" min="1" max="20" step="0.5"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Generated Prompt -->
                    <div class="mt-6">
                        <h3 class="font-semibold text-gray-900 mb-4">Prompt Gerado</h3>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <pre id="generatedPrompt" class="text-sm text-gray-700 whitespace-pre-wrap"></pre>
                        </div>
                        <div class="mt-4 flex space-x-3">
                            <button onclick="app.generatePrompt()" class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                                Gerar Prompt
                            </button>
                            <button onclick="app.copyGeneratedPrompt()" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                                Copiar Prompt
                            </button>
                            <button onclick="app.saveToHistory()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                Salvar no Histórico
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.updateGeneratedPrompt();
    }

    // Generate prompt based on selected models
    generatePrompt() {
        const selectedModels = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => this.models.find(m => m.id === parseInt(cb.value)))
            .filter(Boolean);
        
        const basePrompt = document.getElementById('basePrompt').value;
        const negativePrompt = document.getElementById('negativePrompt').value;
        const steps = document.getElementById('promptSteps').value;
        const cfg = document.getElementById('promptCFG').value;
        
        let prompt = basePrompt + '\n\n';
        
        // Add trigger words from selected models
        selectedModels.forEach(model => {
            if (model.triggerWords) {
                prompt += model.triggerWords + ', ';
            }
        });
        
        prompt = prompt.replace(/,\s*$/, ''); // Remove trailing comma
        
        const fullPrompt = `Prompt: ${prompt}\n\nNegative Prompt: ${negativePrompt}\n\nSettings:\nSteps: ${steps}\nCFG Scale: ${cfg}\n\nModels Used:\n${selectedModels.map(m => `- ${m.name} (${m.type})`).join('\n')}`;
        
        document.getElementById('generatedPrompt').textContent = fullPrompt;
    }

    // Copy generated prompt to clipboard
    copyGeneratedPrompt() {
        const prompt = document.getElementById('generatedPrompt').textContent;
        navigator.clipboard.writeText(prompt).then(() => {
            this.showNotification('Prompt copiado para a área de transferência!', 'success');
        });
    }

    // Update generated prompt
    updateGeneratedPrompt() {
        this.generatePrompt();
    }

    // Open template selector
    openTemplateSelector() {
        const templates = [
            {
                name: 'Portrait Realistic',
                description: 'Para retratos realistas',
                basePrompt: 'RAW photo, portrait, 8k uhd, dslr, soft lighting, high quality, film grain, Fujifilm XT3',
                negativePrompt: '(deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime), text, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck',
                steps: 30,
                cfg: 7
            },
            {
                name: 'Anime Style',
                description: 'Para estilo anime',
                basePrompt: 'anime style, high quality, detailed',
                negativePrompt: '(deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime), text, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck',
                steps: 25,
                cfg: 7
            },
            {
                name: 'Landscape',
                description: 'Para paisagens',
                basePrompt: 'landscape, nature, high quality, detailed, 8k uhd',
                negativePrompt: 'text, watermark, signature, blurry, low quality, distorted',
                steps: 30,
                cfg: 8
            }
        ];
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-2xl font-bold text-gray-900">Selecionar Template</h2>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="grid grid-cols-1 gap-4">
                        ${templates.map(template => `
                            <div class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onclick="app.useTemplate(${JSON.stringify(template).replace(/"/g, '&quot;')})">
                                <h3 class="font-semibold text-gray-900">${template.name}</h3>
                                <p class="text-sm text-gray-600 mb-2">${template.description}</p>
                                <div class="text-xs text-gray-500">
                                    Steps: ${template.steps} | CFG: ${template.cfg}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Use selected template
    useTemplate(template) {
        document.querySelector('.fixed').remove();
        this.openPromptBuilder();
        
        // Fill template data
        setTimeout(() => {
            document.getElementById('basePrompt').value = template.basePrompt;
            document.getElementById('negativePrompt').value = template.negativePrompt;
            document.getElementById('promptSteps').value = template.steps;
            document.getElementById('promptCFG').value = template.cfg;
            this.updateGeneratedPrompt();
        }, 100);
    }

    // Open history modal
    openHistory() {
        const history = JSON.parse(localStorage.getItem('promptHistory')) || [];
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-2xl font-bold text-gray-900">Histórico de Prompts</h2>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-6">
                    ${history.length === 0 ? `
                        <div class="text-center py-8">
                            <i class="fas fa-history text-4xl text-gray-300 mb-4"></i>
                            <p class="text-gray-500">Nenhum prompt salvo no histórico</p>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            ${history.map((item, index) => `
                                <div class="border rounded-lg p-4">
                                    <div class="flex justify-between items-start mb-2">
                                        <h3 class="font-semibold text-gray-900">Prompt ${history.length - index}</h3>
                                        <span class="text-xs text-gray-500">${new Date(item.timestamp).toLocaleString()}</span>
                                    </div>
                                    <pre class="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">${item.prompt}</pre>
                                    <div class="mt-2 flex space-x-2">
                                        <button onclick="app.copyHistoryPrompt(${index})" class="text-blue-600 hover:text-blue-800 text-sm">
                                            <i class="fas fa-copy mr-1"></i>Copiar
                                        </button>
                                        <button onclick="app.deleteHistoryPrompt(${index})" class="text-red-600 hover:text-red-800 text-sm">
                                            <i class="fas fa-trash mr-1"></i>Excluir
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Save prompt to history
    saveToHistory() {
        const prompt = document.getElementById('generatedPrompt').textContent;
        const history = JSON.parse(localStorage.getItem('promptHistory')) || [];
        
        history.unshift({
            prompt: prompt,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 20 prompts
        if (history.length > 20) {
            history.splice(20);
        }
        
        localStorage.setItem('promptHistory', JSON.stringify(history));
        this.showNotification('Prompt salvo no histórico!', 'success');
    }

    // Copy history prompt
    copyHistoryPrompt(index) {
        const history = JSON.parse(localStorage.getItem('promptHistory')) || [];
        const prompt = history[index]?.prompt;
        
        if (prompt) {
            navigator.clipboard.writeText(prompt).then(() => {
                this.showNotification('Prompt copiado!', 'success');
            });
        }
    }

    // Delete history prompt
    deleteHistoryPrompt(index) {
        const history = JSON.parse(localStorage.getItem('promptHistory')) || [];
        history.splice(index, 1);
        localStorage.setItem('promptHistory', JSON.stringify(history));
        this.openHistory(); // Refresh the modal
    }
}

// Initialize the app
const app = new LoraHelper(); 