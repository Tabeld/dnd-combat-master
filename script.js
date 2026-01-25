// Глобальные переменные состояния
const state = {
    creatures: JSON.parse(localStorage.getItem('dnd_creatures')) || [],
    battle: JSON.parse(localStorage.getItem('dnd_battle')) || {
        participants: [],
        currentTurn: 0,
        round: 1,
        log: [],
        groups: {},
        history: [], // Добавляем историю
        historyIndex: -1 // Текущая позиция в истории
    },
    groups: JSON.parse(localStorage.getItem('dnd_groups')) || {},
    currentCreature: null,
    dragItem: null,
    dragType: null,
    editInitiativeIndex: null,
    editingCreatureId: null,
    editCreatureIndex: null
};

// Цвета по умолчанию для групп
const defaultColors = [
    '#263238', '#34495e', '#455a64', '#5d4037', '#616161',
    '#c0392b', '#d35400', '#e64a19', '#bf360c', '#795548',
    '#388e3c', '#00796b', '#3e2723', '#2d3436', '#636e72',
    '#6c5ce7', '#673ab7', '#9c27b0', '#9b59b6', '#aa00ff',
    '#e0c3fc', '#f093fb', '#fbc2eb', '#aa00aa', '#ff00ff',
    '#3f51b5', '#3498db', '#2196f3', '#0984e3', '#00aaff',
    '#03a9f4', '#00bcd4', '#00ffff', '#8fd3f4', '#a6c1ee',
    '#2ecc71', '#4caf50', '#009688', '#1abc9c', '#00b894',
    '#8bc34a', '#aaff00', '#00ff00', '#96e6a1', '#d4fc79',
    '#f57c00', '#ff9800', '#f39c12', '#ffaa00', '#ffc107',
    '#ffeb3b', '#ffff00', '#cddc39', '#f6d365', '#ffeb3b',
    '#e74c3c', '#ff5722', '#e91e63', '#ff00aa', '#ff9a9e',
    '#fda085', '#fbcfe8', '#ffdde1', '#fad3d3', '#fad0c4',
    '#a1887f', '#bcaaa4', '#d7ccc8', '#efebe9', '#6d4c41',
    '#8d6e63', '#fda085', '#fbcfe8', '#e17055', '#fdcb6e',
    '#ff00ff', '#00ffff', '#ffff00', '#ff00aa', '#aa00ff',
    '#00ff00', '#ffaa00', '#aaff00', '#00aaff', '#ff00ff'
];

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('D&D Combat Master загружен');
    
    initTabs();
    renderSavedCreatures();
    renderBattle();
    updateContextCreatures();
    initColorPickers();
    
    // Автосохранение
    setInterval(saveToLocalStorage, 3000);
    
    // Восстановление из localStorage
    if (state.battle.participants.length > 0) {
        updateRoundDisplay();
        addToLog('Сессия восстановлена из сохранения');
    }
    
    // Поиск существ
    const searchInput = document.getElementById('creature-search');
    if (searchInput) {
        searchInput.addEventListener('input', renderSavedCreatures);
    }
});

// Инициализация цветовых пикеров
function initColorPickers() {
    // Цветовой пикер для формы создания существа
    const creatureColorPicker = document.querySelector('#creature-form .color-picker');
    if (creatureColorPicker) {
        creatureColorPicker.addEventListener('click', function(e) {
            const colorOption = e.target.closest('.color-option');
            if (!colorOption) return;
            
            const color = colorOption.dataset.color;
            document.getElementById('cr-color').value = color;
            
            // Убираем выделение со всех и выделяем выбранный
            document.querySelectorAll('#creature-form .color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            colorOption.classList.add('selected');
        });
    }
    
    // Цветовой пикер для быстрого NPC
    const quickNpcColorPicker = document.querySelector('#quick-npc-modal .color-picker');
    if (quickNpcColorPicker) {
        quickNpcColorPicker.addEventListener('click', function(e) {
            const colorOption = e.target.closest('.color-option');
            if (!colorOption) return;
            
            const color = colorOption.dataset.color;
            document.getElementById('quick-npc-color').value = color;
            
            // Убираем выделение со всех и выделяем выбранный
            document.querySelectorAll('#quick-npc-modal .color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            colorOption.classList.add('selected');
        });
    }
    
    // Цветовой пикер для редактирования существа
    const editColorPicker = document.getElementById('color-picker');
    if (editColorPicker) {
        editColorPicker.addEventListener('click', function(e) {
            const colorOption = e.target.closest('.color-option');
            if (!colorOption) return;
            
            const color = colorOption.dataset.color;
            document.getElementById('edit-color').value = color;
            
            // Убираем выделение со всех и выделяем выбранный
            document.querySelectorAll('#color-picker .color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            colorOption.classList.add('selected');
        });
    }
}

// Управление вкладками
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'bestiary') {
                renderSavedCreatures();
            } else if (tabId === 'battle') {
                renderBattle();
            }
        });
    });
}

// ============ БЕСТИАРИЙ ============

// Сохранение существа (создание или редактирование)
function saveCreature() {
    const name = document.getElementById('cr-name').value.trim();
    if (!name) {
        alert('Введите имя существа');
        return;
    }
    
    const creatureData = {
        name: name,
        maxHP: parseInt(document.getElementById('cr-max-hp').value) || 10,
        ac: parseInt(document.getElementById('cr-ac').value) || 10,
        initBonus: parseInt(document.getElementById('cr-init-bonus').value) || 0,
        attackBonus: parseInt(document.getElementById('cr-attack-bonus').value) || 0,
        damage: document.getElementById('cr-damage').value.trim() || '1d6',
        damageType: document.getElementById('cr-damage-type').value,
        resistances: parseDamageTypes(document.getElementById('cr-resistances').value),
        immunities: parseDamageTypes(document.getElementById('cr-immunities').value),
        vulnerabilities: parseDamageTypes(document.getElementById('cr-vulnerabilities').value),
        multiattack: document.getElementById('cr-multiattack').value.trim(),
        legendaryActions: parseActions(document.getElementById('cr-legendary-actions').value),
        lairActions: parseActions(document.getElementById('cr-lair-actions').value),
        color: document.getElementById('cr-color').value || '#3498db'
    };
    
    if (state.editingCreatureId) {
        // Редактирование существующего существа
        const index = state.creatures.findIndex(c => c.id === state.editingCreatureId);
        if (index !== -1) {
            state.creatures[index] = {
                ...state.creatures[index],
                ...creatureData
            };
            addToLog(`Существо "${name}" обновлено`);
        }
        state.editingCreatureId = null;
    } else {
        // Создание нового существа
        const creature = {
            id: Date.now(),
            ...creatureData
        };
        state.creatures.push(creature);
        addToLog(`Создано существо: ${creature.name}`);
    }
    
    saveToLocalStorage();
    renderSavedCreatures();
    resetCreatureForm();
}

// Редактирование существа
function editCreature(creatureId) {
    const creature = state.creatures.find(c => c.id === creatureId);
    if (!creature) return;
    
    // Заполняем форму данными существа
    document.getElementById('cr-id').value = creature.id;
    document.getElementById('cr-name').value = creature.name;
    document.getElementById('cr-max-hp').value = creature.maxHP;
    document.getElementById('cr-ac').value = creature.ac;
    document.getElementById('cr-init-bonus').value = creature.initBonus || 0;
    document.getElementById('cr-attack-bonus').value = creature.attackBonus;
    document.getElementById('cr-damage').value = creature.damage;
    document.getElementById('cr-damage-type').value = creature.damageType;
    document.getElementById('cr-resistances').value = creature.resistances ? creature.resistances.join(', ') : '';
    document.getElementById('cr-immunities').value = creature.immunities ? creature.immunities.join(', ') : '';
    document.getElementById('cr-vulnerabilities').value = creature.vulnerabilities ? creature.vulnerabilities.join(', ') : '';
    document.getElementById('cr-multiattack').value = creature.multiattack || '';
    document.getElementById('cr-legendary-actions').value = creature.legendaryActions ? creature.legendaryActions.join('|') : '';
    document.getElementById('cr-lair-actions').value = creature.lairActions ? creature.lairActions.join('|') : '';
    document.getElementById('cr-color').value = creature.color || '#3498db';
    
    // Устанавливаем выбранный цвет
    document.querySelectorAll('#creature-form .color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === creature.color) {
            opt.classList.add('selected');
        }
    });
    
    // Показываем режим редактирования
    state.editingCreatureId = creatureId;
    document.getElementById('form-title').textContent = 'Редактировать существо';
    document.getElementById('save-button-text').textContent = 'Обновить существо';
    document.getElementById('edit-controls').style.display = 'block';
    
    // Прокручиваем к форме
    document.querySelector('[data-tab="bestiary"]').click();
    document.getElementById('creature-form').scrollIntoView({ behavior: 'smooth' });
}

// Отмена редактирования
function cancelEdit() {
    state.editingCreatureId = null;
    resetCreatureForm();
}

// Сброс формы существа
function resetCreatureForm() {
    document.getElementById('cr-id').value = '';
    document.getElementById('cr-name').value = '';
    document.getElementById('cr-max-hp').value = '100';
    document.getElementById('cr-ac').value = '18';
    document.getElementById('cr-init-bonus').value = '0';
    document.getElementById('cr-attack-bonus').value = '10';
    document.getElementById('cr-damage').value = '2d6+3';
    document.getElementById('cr-damage-type').value = 'slashing';
    document.getElementById('cr-resistances').value = '';
    document.getElementById('cr-immunities').value = '';
    document.getElementById('cr-vulnerabilities').value = '';
    document.getElementById('cr-multiattack').value = '';
    document.getElementById('cr-legendary-actions').value = '';
    document.getElementById('cr-lair-actions').value = '';
    document.getElementById('cr-color').value = '#3498db';
    
    // Сбрасываем цветовой пикер
    document.querySelectorAll('#creature-form .color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === '#3498db') {
            opt.classList.add('selected');
        }
    });
    
    document.getElementById('form-title').textContent = 'Создать существо';
    document.getElementById('save-button-text').textContent = 'Сохранить существо';
    document.getElementById('edit-controls').style.display = 'none';
}

function parseDamageTypes(input) {
    return input.split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);
}

function parseActions(input) {
    return input.split('|')
        .map(a => a.trim())
        .filter(a => a.length > 0);
}

// Отображение сохранённых существ
function renderSavedCreatures() {
    const container = document.getElementById('saved-creatures');
    const searchTerm = document.getElementById('creature-search')?.value.toLowerCase() || '';
    
    // Обновляем счетчик существ
    document.getElementById('creatures-count').textContent = `Всего: ${state.creatures.length}`;
    
    const filteredCreatures = state.creatures.filter(creature =>
        creature.name.toLowerCase().includes(searchTerm) ||
        (creature.damageType && creature.damageType.includes(searchTerm))
    );
    
    if (filteredCreatures.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
                <i class="fas fa-dragon" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 15px;"></i>
                <h3>${searchTerm ? 'Ничего не найдено' : 'Нет сохранённых существ'}</h3>
                <p>${searchTerm ? 'Попробуйте другой поисковый запрос' : 'Создайте первое существо в форме слева'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredCreatures.map(creature => `
        <div class="stat-block" style="min-width: 400px; max-width: 500px;">
            <div class="creature-header" style="margin-bottom: 15px;">
                <div class="creature-name" style="font-size: 1.2rem; margin-bottom: 5px; display: flex; align-items: center; gap: 10px;">
                    <span class="creature-color" style="width: 20px; height: 20px; border-radius: 50%; display: inline-block; background: ${creature.color || '#3498db'};"></span>
                    <span style="flex: 1;">${creature.name}</span>
                    ${creature.legendaryActions && creature.legendaryActions.length > 0 ? 
                        '<i class="fas fa-crown" title="Имеет легендарные действия" style="color: #f39c12;"></i>' : ''}
                    ${creature.lairActions && creature.lairActions.length > 0 ? 
                        '<i class="fas fa-mountain" title="Имеет действия логова" style="color: #7f8c8d;"></i>' : ''}
                </div>
            </div>
            
            <div class="creature-stats-grid" style="
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin: 15px 0;
                padding: 10px;
                background: #f8f9fa;
                border-radius: var(--radius-sm);
            ">
                <div style="text-align: center;">
                    <div style="font-size: 0.8em; color: #666;">HP</div>
                    <div style="font-weight: bold; font-size: 1.2rem; color: #e74c3c;">
                        <i class="fas fa-heart"></i> ${creature.maxHP}
                    </div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 0.8em; color: #666;">КД</div>
                    <div style="font-weight: bold; font-size: 1.2rem; color: #3498db;">
                        <i class="fas fa-shield-alt"></i> ${creature.ac}
                    </div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 0.8em; color: #666;">Атака</div>
                    <div style="font-weight: bold; font-size: 1.2rem; color: #2ecc71;">
                        <i class="fas fa-crosshairs"></i> +${creature.attackBonus}
                    </div>
                </div>
            </div>
            
            <div style="margin: 15px 0; padding: 10px; background: #fff8e1; border-radius: var(--radius-sm);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>Урон:</strong> 
                        <span style="font-weight: bold; font-size: 1.1rem; margin-left: 5px;">${creature.damage}</span>
                    </div>
                    <span class="damage-type" style="background: ${getDamageTypeColor(creature.damageType)}; padding: 3px 10px; border-radius: 15px; color: white; font-size: 0.8rem;">
                        ${creature.damageType}
                    </span>
                </div>
            </div>
            
            ${creature.resistances && creature.resistances.length > 0 ? `
                <div style="margin: 10px 0; padding: 8px; background: #e8f4fd; border-radius: var(--radius-sm);">
                    <div><strong>Сопр.:</strong> 
                        ${creature.resistances.map(r => 
                            `<span style="display: inline-block; padding: 2px 8px; background: var(--info); color: white; border-radius: 10px; margin: 2px; font-size: 0.8rem;">${r}</span>`
                        ).join(' ')}
                    </div>
                </div>
            ` : ''}
            
            ${creature.multiattack ? `
                <div style="margin: 10px 0; padding: 8px; background: #f0f8ff; border-radius: var(--radius-sm);">
                    <div><strong>Мультиатака:</strong> ${creature.multiattack}</div>
                </div>
            ` : ''}
            
            <div class="btn-group" style="
                margin-top: 20px;
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            ">
                <button onclick="addSingleToBattle(${creature.id})" 
                        class="btn btn-sm btn-primary" style="padding: 8px 5px;">
                    <i class="fas fa-user"></i> В бой
                </button>
                <button onclick="showAddGroupToBattleModal(${creature.id})" 
                        class="btn btn-sm btn-info" style="padding: 8px 5px;">
                    <i class="fas fa-users"></i> Группа
                </button>
                <button onclick="editCreature(${creature.id})" 
                        class="btn btn-sm btn-warning" style="padding: 8px 5px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteCreature(${creature.id})" 
                        class="btn btn-sm btn-danger" style="padding: 8px 5px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Вспомогательная функция для цветов типов урона
function getDamageTypeColor(type) {
    const colors = {
        slashing: '#e74c3c',
        piercing: '#3498db',
        bludgeoning: '#8e44ad',
        fire: '#f39c12',
        cold: '#1abc9c',
        acid: '#2ecc71',
        lightning: '#f1c40f',
        poison: '#9b59b6',
        radiant: '#f1c40f',
        necrotic: '#2c3e50',
        psychic: '#e84393',
        force: '#6c5ce7',
        thunder: '#0984e3'
    };
    return colors[type] || '#7f8c8d';
}

// ============ БОЕВОЙ ТРЕКЕР ============

// Показать модальное окно создания группы
function showCreateGroupModal() {
    const templateSelect = document.getElementById('group-template');
    templateSelect.innerHTML = '<option value="">Выберите существо</option>';
    
    state.creatures.forEach(creature => {
        const option = document.createElement('option');
        option.value = creature.id;
        option.textContent = creature.name;
        templateSelect.appendChild(option);
    });
    
    showModal('create-group-modal');
}

// Создание группы из модального окна
function createGroupFromModal() {
    const groupName = document.getElementById('group-name').value.trim();
    const count = parseInt(document.getElementById('group-count').value) || 3;
    const templateId = parseInt(document.getElementById('group-template').value);
    const numberingType = document.getElementById('group-numbering').value;
    const autoColors = document.getElementById('auto-colors').checked;
    
    if (!groupName) {
        alert('Введите название группы');
        return;
    }
    
    if (!templateId) {
        alert('Выберите шаблон существа');
        return;
    }
    
    const template = state.creatures.find(c => c.id === templateId);
    if (!template) {
        alert('Шаблон не найден');
        return;
    }
    
    const groupId = `group_${Date.now()}`;
    const groupInitiative = rollInitiative(template.initBonus || 0);
    
    // Создаем уникальные цвета для существ
    const colors = [];
    if (autoColors) {
        for (let i = 0; i < count; i++) {
            colors.push(defaultColors[i % defaultColors.length]);
        }
    } else {
        // Все одного цвета
        for (let i = 0; i < count; i++) {
            colors.push(template.color || '#3498db');
        }
    }
    
    for (let i = 0; i < count; i++) {
        const creature = createCreatureInstance(template, Date.now() + i);
        creature.initiative = groupInitiative;
        creature.groupId = groupId;
        creature.groupNumber = i + 1;
        creature.color = colors[i];
        
        // Формируем имя в зависимости от типа нумерации
        let numberSuffix = '';
        switch(numberingType) {
            case 'numbers':
                numberSuffix = ` ${i + 1}`;
                break;
            case 'letters':
                numberSuffix = ` ${String.fromCharCode(65 + i)}`;
                break;
            case 'roman':
                const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
                numberSuffix = ` ${romanNumerals[i] || i + 1}`;
                break;
        }
        
        creature.name = `${groupName}${numberSuffix}`;
        creature.baseName = groupName;
        creature.groupName = `Группа "${groupName}"`;
        
        state.battle.participants.push(creature);
    }
    
    addToLog(`Создана группа "${groupName}" (${count} существ) с инициативой ${groupInitiative}`);
    
    sortInitiative();
    renderBattle();
    updateContextCreatures();
    saveToLocalStorage();
    closeModal('create-group-modal');
}

// Показать модальное окно добавления в бой
function showAddToBattleModal() {
    const container = document.getElementById('battle-creatures-list');
    container.innerHTML = '';
    
    if (state.creatures.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет сохранённых существ</div>';
        showModal('add-to-battle-modal');
        return;
    }
    
    // Добавляем кнопку для создания группы
    const groupButton = document.createElement('div');
    groupButton.className = 'stat-block';
    groupButton.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h4 style="margin-bottom: 15px;">Добавить группу существ</h4>
            <button onclick="showCreateGroupModal()" class="btn btn-success">
                <i class="fas fa-users"></i> Создать новую группу
            </button>
        </div>
    `;
    container.appendChild(groupButton);
    
    // Добавляем существ
    container.innerHTML += state.creatures.map(creature => `
        <div class="stat-block">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${creature.name}</strong>
                    <div style="font-size: 0.9em; color: #666;">
                        HP: ${creature.maxHP} | КД: ${creature.ac} | Атака: +${creature.attackBonus}
                    </div>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="addSingleToBattle(${creature.id})" 
                            class="btn btn-sm btn-primary">
                        <i class="fas fa-user"></i> 1
                    </button>
                    <button onclick="showAddGroupToBattleModal(${creature.id})" 
                            class="btn btn-sm btn-info">
                        <i class="fas fa-users"></i> Группа
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    showModal('add-to-battle-modal');
}

// Показать модальное окно для добавления группы из конкретного существа
function showAddGroupToBattleModal(creatureId) {
    const template = state.creatures.find(c => c.id === creatureId);
    if (!template) return;
    
    const groupName = prompt('Название группы:', template.name);
    if (!groupName) return;
    
    const count = prompt('Сколько существ в группе?', '3');
    if (!count) return;
    
    const numCount = parseInt(count);
    if (isNaN(numCount) || numCount < 1) {
        alert('Введите корректное число');
        return;
    }
    
    const numberingType = prompt('Тип нумерации (numbers, letters, roman):', 'numbers');
    if (!['numbers', 'letters', 'roman'].includes(numberingType)) {
        alert('Некорректный тип нумерации. Используйте: numbers, letters, roman');
        return;
    }
    
    const autoColors = confirm('Автоматически задать разные цвета?');
    
    const groupId = `group_${Date.now()}`;
    const groupInitiative = rollInitiative(template.initBonus || 0);
    
    // Создаем уникальные цвета для существ
    const colors = [];
    if (autoColors) {
        for (let i = 0; i < numCount; i++) {
            colors.push(defaultColors[i % defaultColors.length]);
        }
    } else {
        // Все одного цвета
        for (let i = 0; i < numCount; i++) {
            colors.push(template.color || '#3498db');
        }
    }
    
    for (let i = 0; i < numCount; i++) {
        const creature = createCreatureInstance(template, Date.now() + i);
        creature.initiative = groupInitiative;
        creature.groupId = groupId;
        creature.groupNumber = i + 1;
        creature.color = colors[i];
        
        // Формируем имя в зависимости от типа нумерации
        let numberSuffix = '';
        switch(numberingType) {
            case 'numbers':
                numberSuffix = ` ${i + 1}`;
                break;
            case 'letters':
                numberSuffix = ` ${String.fromCharCode(65 + i)}`;
                break;
            case 'roman':
                const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
                numberSuffix = ` ${romanNumerals[i] || i + 1}`;
                break;
        }
        
        creature.name = `${groupName}${numberSuffix}`;
        creature.baseName = groupName;
        creature.groupName = `Группа "${groupName}"`;
        
        state.battle.participants.push(creature);
    }
    
    addToLog(`Создана группа "${groupName}" (${numCount} существ) с инициативой ${groupInitiative}`);
    
    sortInitiative();
    renderBattle();
    updateContextCreatures();
    saveToLocalStorage();
    closeModal('add-to-battle-modal');
}

// Добавить одиночное существо в бой
function addSingleToBattle(creatureId) {
    const template = state.creatures.find(c => c.id === creatureId);
    if (!template) return;
    
    const creature = createCreatureInstance(template, Date.now());
    creature.color = template.color || '#3498db';
    state.battle.participants.push(creature);
    
    addToLog(`Добавлено существо "${creature.name}" с инициативой ${creature.initiative}`);
    
    sortInitiative();
    renderBattle();
    updateContextCreatures();
    saveToLocalStorage();
    closeModal('add-to-battle-modal');
}

// Создание экземпляра существа с временными хитами
function createCreatureInstance(template, id) {
    return {
        ...JSON.parse(JSON.stringify(template)),
        id: id,
        currentHP: template.maxHP,
        tempHP: 0, // Временные хиты
        initiative: rollInitiative(template.initBonus || 0),
        conditions: [],
        concentration: false,
        usedLegendaryActions: 0,
        usedLairActions: false,
        baseName: template.name,
        groupId: null,
        groupIndex: 0,
        isGrouped: false,
        groupNumber: 0,
        color: template.color || '#3498db',
        originalAC: template.ac,
        originalAttackBonus: template.attackBonus,
        originalDamage: template.damage,
        originalDamageType: template.damageType
    };
}

// Бросок инициативы с бонусом
function rollInitiative(bonus = 0) {
    return Math.floor(Math.random() * 20) + 1 + bonus;
}

// Бросок инициативы всем
function rollAllInitiative() {
    // Для групп: сначала собираем все группы
    const groups = {};
    const groupInitiatives = {};
    
    // Собираем группы и их участников
    state.battle.participants.forEach(creature => {
        if (creature.groupId) {
            if (!groups[creature.groupId]) {
                groups[creature.groupId] = [];
                // Бросаем инициативу для группы ОДИН РАЗ
                groupInitiatives[creature.groupId] = rollInitiative(creature.initBonus || 0);
            }
            groups[creature.groupId].push(creature);
        }
    });
    
    // Устанавливаем инициативу для всех членов группы
    Object.keys(groups).forEach(groupId => {
        const groupInitiative = groupInitiatives[groupId];
        groups[groupId].forEach(member => {
            member.initiative = groupInitiative;
        });
    });
    
    // Для одиночных существ бросаем инициативу индивидуально
    state.battle.participants.forEach(creature => {
        if (!creature.groupId) {
            creature.initiative = rollInitiative(creature.initBonus || 0);
        }
    });
    
    sortInitiative();
    renderBattle();
    saveToLocalStorage();
    addToLog('Инициатива переброшена для всех существ');
}

// Функция сортировки инициативы
function sortInitiative() {
    if (state.battle.participants.length === 0) return;
    
    // Создаем массив для сортировки
    const toSort = [...state.battle.participants];
    
    // Сортируем по инициативе (от большего к меньшему)
    toSort.sort((a, b) => {
        if (b.initiative === a.initiative) {
            // Если инициатива равна, сортируем по имени
            return a.name.localeCompare(b.name);
        }
        return b.initiative - a.initiative;
    });
    
    // Обновляем исходный массив
    state.battle.participants = toSort;
    
    saveToLocalStorage();
}

// Отображение боя
function renderBattle() {
    const list = document.getElementById('initiative-list');
    const details = document.getElementById('creature-details');
    
    list.innerHTML = '';
    
    if (state.battle.participants.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет участников боя. Добавьте существ!</div>';
        details.innerHTML = '<div class="empty-state">Выберите существо для управления</div>';
        document.getElementById('current-turn-name').textContent = '-';
        return;
    }
    
    // Обновление текущего хода
    const current = state.battle.participants[state.battle.currentTurn];
    document.getElementById('current-turn-name').textContent = current ? current.name : '-';
    
    // Группируем существа для отображения
    const groups = {};
    const standalone = [];
    
    // Помечаем всех как необработанных
    state.battle.participants.forEach(c => c._processed = false);
    
    // Сначала собираем группы
    for (let i = 0; i < state.battle.participants.length; i++) {
        const creature = state.battle.participants[i];
        
        if (creature._processed) continue;
        
        if (creature.groupId) {
            // Находим всех существ с таким же groupId
            const groupMembers = state.battle.participants.filter(p => p.groupId === creature.groupId);
            
            // Помечаем всех членов группы как обработанные
            groupMembers.forEach(member => member._processed = true);
            
            // Создаем запись группы
            groups[creature.groupId] = {
                id: creature.groupId,
                name: creature.baseName || creature.name,
                members: groupMembers,
                initiative: groupMembers[0].initiative,
                isExpanded: state.battle.groups[creature.groupId] || false
            };
        } else {
            // Одиночное существо
            creature._processed = true;
            standalone.push({ ...creature, index: i });
        }
    }
    
    // Сортируем группы по инициативе
    const sortedGroups = Object.values(groups).sort((a, b) => b.initiative - a.initiative);
    
    // Сортируем одиночные существа по инициативе
    standalone.sort((a, b) => b.initiative - a.initiative);
    
    // Объединяем отсортированные группы и одиночные существа
    const displayItems = [];
    let groupIdx = 0, standaloneIdx = 0;
    
    while (groupIdx < sortedGroups.length || standaloneIdx < standalone.length) {
        if (groupIdx < sortedGroups.length && standaloneIdx < standalone.length) {
            // Выбираем элемент с большей инициативой
            if (sortedGroups[groupIdx].initiative >= standalone[standaloneIdx].initiative) {
                displayItems.push({ type: 'group', data: sortedGroups[groupIdx++] });
            } else {
                displayItems.push({ type: 'standalone', data: standalone[standaloneIdx++] });
            }
        } else if (groupIdx < sortedGroups.length) {
            displayItems.push({ type: 'group', data: sortedGroups[groupIdx++] });
        } else {
            displayItems.push({ type: 'standalone', data: standalone[standaloneIdx++] });
        }
    }
    
    // Отображаем все элементы в правильном порядке
    displayItems.forEach(item => {
        if (item.type === 'group') {
            const group = item.data;
            const isActive = group.members.some(member => {
                const memberIndex = state.battle.participants.findIndex(c => c.id === member.id);
                return memberIndex === state.battle.currentTurn;
            });
            
            const groupElement = createGroupElement(group, isActive);
            list.appendChild(groupElement);
        } else {
            const creature = item.data;
            const isActive = creature.index === state.battle.currentTurn;
            const creatureElement = createInitiativeItem(creature, isActive);
            list.appendChild(creatureElement);
        }
    });
    
    // Обновляем детали выбранного существа
    if (state.currentCreature !== null) {
        renderCreatureDetails();
    }
    
    updateBattleStats();
    updateRoundDisplay();
}

// Создание элемента инициативы для одиночного существа
function createInitiativeItem(creature, isActive) {
    const div = document.createElement('div');
    div.className = `initiative-item ${isActive ? 'active' : ''}`;
    div.setAttribute('data-index', creature.index);
    div.setAttribute('draggable', 'true');
    
    // Drag & Drop события
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);
    div.addEventListener('dragend', handleDragEnd);
    
    // Полоска HP
const hpPercentage = Math.max(0, (creature.currentHP / creature.maxHP) * 100);
    const tempHPPercentage = creature.tempHP > 0 ? 
        Math.min(100, (creature.tempHP / creature.maxHP) * 100) : 0;
    
    div.innerHTML = `
        <div class="initiative-score">
            ${creature.initiative}
            <button class="edit-btn" onclick="editCreatureInitiative(${creature.index})">
                <i class="fas fa-edit"></i>
            </button>
        </div>
        <div style="flex: 1;">
            <div class="creature-name">
                ${creature.groupNumber ? `<span class="group-number">${creature.groupNumber}</span>` : ''}
                <span class="creature-color" style="background: ${creature.color};" 
                      onclick="changeCreatureColor(${creature.index})" title="Изменить цвет"></span>
                ${creature.name}
                ${creature.currentHP <= 0 ? ' 💀' : ''}
            </div>
            <div class="hp-bar-container">
                <div class="hp-bar" style="width: ${hpPercentage}%"></div>
            </div>
            <div class="creature-stats">
                <span>❤️ ${creature.currentHP}/${creature.maxHP}</span>
                <span>🛡️ ${creature.ac}</span>
                ${creature.tempHP > 0 ? 
                    `<span class="temp-hp-display">🛡️✨ ${creature.tempHP}</span>` : ''}
            </div>
            <div class="conditions">
                ${creature.conditions.map(c => 
                    `<span class="condition">${c.name} (${c.duration})</span>`
                ).join('')}
            </div>
        </div>
        <div>
            <button onclick="selectCreature(${creature.index})" class="btn btn-sm btn-primary">
                <i class="fas fa-crosshairs"></i>
            </button>
            <button onclick="showEditCreatureModal(${creature.index})" class="btn btn-sm btn-warning">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="removeFromBattle(${creature.index})" class="btn btn-sm btn-danger">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return div;
}

// Создание элемента группы
function createGroupElement(group, isActive) {
    const groupElement = document.createElement('div');
    groupElement.className = `initiative-item ${isActive ? 'active' : ''}`;
    groupElement.setAttribute('data-group-id', group.id);
    groupElement.setAttribute('draggable', 'true');
    
    // Drag & Drop события
    groupElement.addEventListener('dragstart', handleDragStart);
    groupElement.addEventListener('dragover', handleDragOver);
    groupElement.addEventListener('drop', handleDrop);
    groupElement.addEventListener('dragend', handleDragEnd);
    
    const aliveCount = group.members.filter(m => m.currentHP > 0).length;
    
    groupElement.innerHTML = `
        <div class="initiative-score">
            ${group.initiative}
            <button class="edit-btn" onclick="editGroupInitiative('${group.id}')">
                <i class="fas fa-edit"></i>
            </button>
        </div>
        <div style="flex: 1;">
            <div class="creature-name group group-header" onclick="toggleGroup('${group.id}')">
                <i class="fas fa-users"></i>
                Группа "${group.name}" (${aliveCount}/${group.members.length})
                <i class="fas fa-chevron-right group-chevron ${group.isExpanded ? 'open' : ''}"></i>
            </div>
            <div class="creature-stats">
                <span>❤️ ${group.members.filter(m => m.currentHP > 0).length}/${group.members.length}</span>
                <span>🛡️ ${group.members[0]?.ac || 10}</span>
            </div>
        </div>
        <div>
            <button onclick="editGroupInitiative('${group.id}')" class="btn btn-sm btn-warning">
                <i class="fas fa-edit"></i>
            </button>
        </div>
    `;
    
    // Отображаем членов группы, если группа раскрыта
    if (group.isExpanded) {
        const membersContainer = document.createElement('div');
        membersContainer.className = 'group-members';
        
        // Добавляем drop-зону перед членами группы
        const groupDropZone = document.createElement('div');
        groupDropZone.className = 'group-drop-zone';
        groupDropZone.innerHTML = 'Перетащите существо сюда, чтобы добавить в группу';
        groupDropZone.addEventListener('dragover', handleDragOver);
        groupDropZone.addEventListener('drop', (e) => handleDropToGroup(e, group.id));
        
        membersContainer.appendChild(groupDropZone);
        
        group.members.forEach(member => {
            const memberIndex = state.battle.participants.findIndex(c => c.id === member.id);
            if (memberIndex !== -1) {
                const memberElement = document.createElement('div');
                memberElement.className = `group-member ${memberIndex === state.battle.currentTurn ? 'active' : ''}`;
                memberElement.setAttribute('data-index', memberIndex);
                memberElement.setAttribute('draggable', 'true');
                
                memberElement.addEventListener('dragstart', handleDragStart);
                memberElement.addEventListener('dragover', handleDragOver);
                memberElement.addEventListener('drop', handleDrop);
                memberElement.addEventListener('dragend', handleDragEnd);
                
                // Полоска HP для члена группы
                const hpPercentage = Math.max(0, (member.currentHP / member.maxHP) * 100);
                const tempHPPercentage = member.tempHP > 0 ? 
                    Math.min(100, (member.tempHP / member.maxHP) * 100) : 0;
                
                memberElement.innerHTML = `
                    <div style="flex: 1;">
                        <div class="creature-name">
                            <span class="group-number">${member.groupNumber}</span>
                            <span class="creature-color" style="background: ${member.color};" 
                                  onclick="changeCreatureColor(${memberIndex})" title="Изменить цвет"></span>
                            ${member.name}
                            ${member.currentHP <= 0 ? ' 💀' : ''}
                        </div>
                        <div class="hp-bar-container" style="height: 6px; margin: 3px 0;">
                            <div class="hp-bar" style="width: ${hpPercentage}%"></div>
                        </div>
                        <div class="hp-display">
                            <span>❤️ ${member.currentHP}/${member.maxHP}</span>
                            ${member.tempHP > 0 ? 
                                `<span class="temp-hp-display" style="font-size: 0.7rem;">🛡️✨ ${member.tempHP}</span>` : ''}
                            ${member.concentration ? ' ✨' : ''}
                        </div>
                    </div>
                    <div>
                        <button onclick="selectCreature(${memberIndex})" class="btn btn-xs btn-primary">
                            <i class="fas fa-crosshairs"></i>
                        </button>
                        <button onclick="removeFromBattle(${memberIndex})" class="btn btn-xs btn-danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                membersContainer.appendChild(memberElement);
            }
        });
        
        groupElement.appendChild(membersContainer);
    }
    
    return groupElement;
}

// ============ DRAG & DROP ============

function handleDragStart(e) {
    const item = e.target.closest('.initiative-item, .group-member');
    if (!item) return;
    
    state.dragItem = item;
    
    if (item.classList.contains('group-member')) {
        const index = parseInt(item.getAttribute('data-index'));
        state.dragType = 'creature';
        state.dragData = { index: index };
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'creature',
            index: index
        }));
    } else {
        const groupId = item.getAttribute('data-group-id');
        if (groupId) {
            state.dragType = 'group';
            state.dragData = { groupId: groupId };
            e.dataTransfer.setData('text/plain', JSON.stringify({
                type: 'group',
                groupId: groupId
            }));
        } else {
            const index = parseInt(item.getAttribute('data-index'));
            state.dragType = 'creature';
            state.dragData = { index: index };
            e.dataTransfer.setData('text/plain', JSON.stringify({
                type: 'creature',
                index: index
            }));
        }
    }
    
    // Добавляем класс dragging
    setTimeout(() => {
        item.classList.add('dragging');
    }, 0);
    
    // Активируем drop-зоны
    document.getElementById('ungroup-drop-zone').classList.add('active');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const dropZone = e.target.closest('.drop-zone, .group-drop-zone');
    if (dropZone) {
        dropZone.classList.add('active');
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    // Убираем активные классы с drop-зон
    document.getElementById('ungroup-drop-zone').classList.remove('active');
    document.querySelectorAll('.group-drop-zone.active').forEach(z => z.classList.remove('active'));
    
    try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        if (data.type === 'creature') {
            const targetItem = e.target.closest('.initiative-item');
            if (targetItem) {
                const targetGroupId = targetItem.getAttribute('data-group-id');
                if (targetGroupId) {
                    // Бросаем существо на группу
                    addCreatureToGroup(data.index, targetGroupId);
                }
            }
        }
    } catch (err) {
        console.error('Ошибка при обработке drop:', err);
    }
}

function handleDropToGroup(e, groupId) {
    e.preventDefault();
    
    try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        if (data.type === 'creature') {
            addCreatureToGroup(data.index, groupId);
        }
    } catch (err) {
        console.error('Ошибка при обработке drop в группу:', err);
    }
}

function handleDropToUngroup(e) {
    e.preventDefault();
    
    try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        if (data.type === 'creature') {
            ungroupCreature(data.index);
        }
    } catch (err) {
        console.error('Ошибка при обработке drop в ungroup:', err);
    }
}

function handleDragEnd(e) {
    // Убираем класс dragging
    if (state.dragItem) {
        state.dragItem.classList.remove('dragging');
    }
    
    // Убираем активные классы с drop-зон
    document.getElementById('ungroup-drop-zone').classList.remove('active');
    document.querySelectorAll('.group-drop-zone.active').forEach(z => z.classList.remove('active'));
    
    // Сбрасываем состояние drag
    state.dragItem = null;
    state.dragType = null;
    state.dragData = null;
}

// Добавление существа в группу через drag & drop
function addCreatureToGroup(creatureIndex, targetGroupId) {
    const creature = state.battle.participants[creatureIndex];
    if (!creature || creature.groupId === targetGroupId) return;
    
    const oldGroupId = creature.groupId;
    const targetGroup = state.battle.participants.find(c => c.groupId === targetGroupId);
    const newGroupName = targetGroup ? targetGroup.baseName : 'Группа';
    
    // Находим максимальный номер в группе
    const groupMembers = state.battle.participants.filter(c => c.groupId === targetGroupId);
    const maxGroupNumber = groupMembers.reduce((max, c) => Math.max(max, c.groupNumber || 0), 0);
    
    creature.groupId = targetGroupId;
    creature.groupNumber = maxGroupNumber + 1;
    creature.groupName = `Группа "${newGroupName}"`;
    creature.baseName = newGroupName;
    
    addToLog(`${creature.name} перемещен в группу "${newGroupName}"`);
    
    // Если существо было в другой группе, проверяем, не пустая ли теперь старая группа
    if (oldGroupId) {
        const oldGroupCount = state.battle.participants.filter(c => c.groupId === oldGroupId).length;
        if (oldGroupCount === 0) {
            // Удаляем пустую группу
            delete state.battle.groups[oldGroupId];
            addToLog(`Группа удалена (пустая)`);
        }
    }
    
    renderBattle();
    saveToLocalStorage();
}

// Вывод существа из группы через drag & drop
function ungroupCreature(index) {
    const creature = state.battle.participants[index];
    if (!creature || !creature.groupId) return;
    
    const oldGroupId = creature.groupId;
    
    creature.groupId = null;
    creature.groupName = null;
    creature.groupNumber = 0;
    creature.baseName = creature.name;
    
    addToLog(`${creature.name} выведен из группы`);
    
    // Проверяем, не пустая ли теперь старая группа
    const oldGroupCount = state.battle.participants.filter(c => c.groupId === oldGroupId).length;
    if (oldGroupCount === 0) {
        // Удаляем пустую группу
        delete state.battle.groups[oldGroupId];
        addToLog(`Группа удалена (пустая)`);
    }
    
    renderBattle();
    saveToLocalStorage();
}

// Переключение группы
function toggleGroup(groupId) {
    state.battle.groups[groupId] = !state.battle.groups[groupId];
    renderBattle();
}

// Удаление существа из боя
function removeFromBattle(index) {
    if (confirm('Удалить это существо из боя?')) {
        const creature = state.battle.participants[index];
        const groupId = creature.groupId;
        
        state.battle.participants.splice(index, 1);
        
        addToLog(`${creature.name} удалён из боя`);
        
        // Если существо было в группе, проверяем, не пустая ли теперь группа
        if (groupId) {
            const groupCount = state.battle.participants.filter(c => c.groupId === groupId).length;
            if (groupCount === 0) {
                // Удаляем пустую группу
                delete state.battle.groups[groupId];
                addToLog(`Группа удалена (пустая)`);
            }
        }
        
        if (state.currentCreature === index) {
            state.currentCreature = null;
        } else if (state.currentCreature > index) {
            state.currentCreature--;
        }
        
        if (state.battle.currentTurn >= state.battle.participants.length) {
            state.battle.currentTurn = Math.max(0, state.battle.participants.length - 1);
        }
        
        renderBattle();
        updateContextCreatures();
        saveToLocalStorage();
    }
}

// Редактирование инициативы
function editCreatureInitiative(index) {
    const creature = state.battle.participants[index];
    if (!creature) return;
    
    state.editInitiativeIndex = index;
    document.getElementById('edit-initiative').value = creature.initiative;
    showModal('initiative-modal');
}

// Редактирование инициативы группы
function editGroupInitiative(groupId) {
    const groupMembers = state.battle.participants.filter(p => p.groupId === groupId);
    if (groupMembers.length === 0) return;
    
    state.editInitiativeIndex = groupId;
    document.getElementById('edit-initiative').value = groupMembers[0].initiative;
    showModal('initiative-modal');
}

// Сохранение инициативы
function saveInitiative() {
    if (state.editInitiativeIndex === null) return;
    
    const newInitiative = parseInt(document.getElementById('edit-initiative').value);
    if (!isNaN(newInitiative)) {
        // Если редактируем группу
        if (typeof state.editInitiativeIndex === 'string') {
            const groupId = state.editInitiativeIndex;
            state.battle.participants.forEach(c => {
                if (c.groupId === groupId) {
                    c.initiative = newInitiative;
                }
            });
            addToLog(`Инициатива группы изменена на ${newInitiative}`);
        } else {
            // Редактируем отдельное существо
            const creature = state.battle.participants[state.editInitiativeIndex];
            creature.initiative = newInitiative;
            
            // Если это член группы, обновляем инициативу у всех членов
            if (creature.groupId) {
                state.battle.participants.forEach(c => {
                    if (c.groupId === creature.groupId) {
                        c.initiative = newInitiative;
                    }
                });
            }
            
            addToLog(`Инициатива ${creature.name} изменена на ${newInitiative}`);
        }
        
        sortInitiative();
        renderBattle();
        saveToLocalStorage();
    }
    
    closeModal('initiative-modal');
    state.editInitiativeIndex = null;
}

// ============ УПРАВЛЕНИЕ СУЩЕСТВАМИ ============

// Выбор существа
function selectCreature(index) {
    state.currentCreature = index;
    renderCreatureDetails();
}

// Отображение деталей существа с временными хитами и редактированием
function renderCreatureDetails() {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) {
        document.getElementById('creature-details').innerHTML = '<div class="empty-state">Существо не найдено</div>';
        return;
    }
    
    const isGroupMember = creature.groupId && 
        state.battle.participants.filter(p => p.groupId === creature.groupId).length > 1;
    
    let html = `
        <div class="stat-block">
            <div class="creature-header">
                <h4>
                    <span class="creature-color" style="background: ${creature.color}; width: 20px; height: 20px;"></span>
                    ${creature.name}
                    ${creature.groupNumber ? `<span class="group-number" style="margin-left: 10px;">${creature.groupNumber}</span>` : ''}
                </h4>
                ${isGroupMember ? `<small>(Группа: ${creature.baseName})</small>` : ''}
            </div>
            
            <div class="creature-stats-detailed">
                <div class="stat-item">
                    <label>HP</label>
                    <span>${creature.currentHP} / ${creature.maxHP}</span>
                </div>
                <div class="stat-item">
                    <label>Временные HP</label>
                    <span>${creature.tempHP}</span>
                </div>
                <div class="stat-item">
                    <label>КД</label>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span id="ac-display-${state.currentCreature}" 
                              style="font-weight: bold; font-size: 1.3rem; cursor: pointer; padding: 2px 5px; border-radius: 3px;"
                              onclick="enableACEdit(${state.currentCreature})" 
                              onmouseover="this.style.backgroundColor='#f0f0f0'"
                              onmouseout="this.style.backgroundColor='transparent'"
                              title="Кликните для редактирования">
                            ${creature.ac}
                        </span>
                        <input type="number" 
                               id="ac-edit-${state.currentCreature}" 
                               value="${creature.ac}" 
                               min="0" 
                               max="30"
                               style="display: none; width: 70px; padding: 5px; font-size: 1.1rem; text-align: center; border: 2px solid var(--secondary); border-radius: 4px;"
                               onblur="saveAC(${state.currentCreature})" 
                               onkeypress="if(event.keyCode === 13) saveAC(${state.currentCreature})">
                        <button onclick="enableACEdit(${state.currentCreature})" 
                                class="btn btn-xs" 
                                style="padding: 3px 8px; font-size: 0.8rem;">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
                <div class="stat-item">
                    <label>Инициатива</label>
                    <span>${creature.initiative}</span>
                </div>
            </div>
            
            <div class="hp-control">
                <input type="number" id="hp-change" class="hp-input-small" placeholder="-10">
                <button onclick="showDamageModal()" class="btn btn-danger">Урон</button>
                <button onclick="showHealingModal()" class="btn btn-success">Лечение</button>
                <button onclick="showTempHPModal()" class="btn btn-warning">
                    <i class="fas fa-shield-alt"></i> Временные HP
                </button>
            </div>

            <div class="hp-control" style="margin-top: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: bold;">Быстрое изменение КД:</span>
                    <button onclick="changeAC(${state.currentCreature}, -1)" class="btn btn-sm btn-warning">-1</button>
                    <button onclick="changeAC(${state.currentCreature}, 1)" class="btn btn-sm btn-success">+1</button>
                    <button onclick="changeAC(${state.currentCreature}, -2)" class="btn btn-sm btn-warning">-2</button>
                    <button onclick="changeAC(${state.currentCreature}, 2)" class="btn btn-sm btn-success">+2</button>
                </div>
            </div>

            <div class="temporary-hp-control">
                <h5><i class="fas fa-shield-alt"></i> Временные хиты</h5>
                <p style="font-size: 0.9em; margin-bottom: 10px;">
                    <strong>Текущие:</strong> ${creature.tempHP}
                </p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="addTempHP(5, 'add')" class="btn btn-sm" style="background: #f39c12; color: white;">
                        <i class="fas fa-plus"></i> +5 временных HP
                    </button>
                    <button onclick="addTempHP(10, 'add')" class="btn btn-sm" style="background: #f39c12; color: white;">
                        <i class="fas fa-plus"></i> +10 временных HP
                    </button>
                    <button onclick="clearTempHP()" class="btn btn-sm btn-danger">
                        <i class="fas fa-trash"></i> Сбросить
                    </button>
                </div>
            </div>
            
            <div class="action-buttons">
                <button onclick="rollAttack()" class="btn btn-warning">
                    <i class="fas fa-crosshairs"></i> Атака
                </button>
                <button onclick="rollDamage()" class="btn btn-danger">
                    <i class="fas fa-bolt"></i> Урон
                </button>
                <button onclick="showEditCreatureModal(${state.currentCreature})" class="btn btn-primary">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
            </div>
    `;
    
    // Урон и тип урона
    html += `
        <div class="section">
            <h5><i class="fas fa-bolt"></i> Атака</h5>
            <div>
                <strong>Урон:</strong> ${creature.damage} 
                <span class="damage-type">${creature.damageType}</span>
            </div>
            ${creature.multiattack ? `
                <div style="margin-top: 10px;">
                    <strong>Мультиатака:</strong> ${creature.multiattack}
                </div>
            ` : ''}
        </div>
    `;
    
    // Состояния
    if (creature.conditions.length > 0) {
        html += `
            <div class="section">
                <h5><i class="fas fa-exclamation-triangle"></i> Состояния</h5>
                <div class="conditions">
                    ${creature.conditions.map((cond, idx) => `
                        <span class="condition">
                            ${cond.name} (${cond.duration})
                            <button onclick="removeCondition(${idx})" class="btn btn-xs">
                                <i class="fas fa-times"></i>
                            </button>
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Резисты/Иммунитеты/Уязвимости
    if (creature.resistances.length > 0 || creature.immunities.length > 0 || creature.vulnerabilities.length > 0) {
        html += `
            <div class="section">
                <h5><i class="fas fa-shield-alt"></i> Защита</h5>
                <div class="damage-modifiers">
        `;
        
        if (creature.resistances.length > 0) {
            html += creature.resistances.map(r => 
                `<span class="damage-mod resistance">${r}</span>`
            ).join('');
        }
        
        if (creature.immunities.length > 0) {
            html += creature.immunities.map(i => 
                `<span class="damage-mod immunity">${i}</span>`
            ).join('');
        }
        
        if (creature.vulnerabilities.length > 0) {
            html += creature.vulnerabilities.map(v => 
                `<span class="damage-mod vulnerability">${v}</span>`
            ).join('');
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Легендарные действия
    if (creature.legendaryActions && creature.legendaryActions.length > 0) {
        html += `
            <div class="section">
                <h5><i class="fas fa-crown"></i> Легендарные действия</h5>
                <div class="legendary-actions-list">
                    ${creature.legendaryActions.map((action, idx) => `
                        <div class="action-item">
                            ${action}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Действия логова
    if (creature.lairActions && creature.lairActions.length > 0) {
        html += `
            <div class="section">
                <h5><i class="fas fa-mountain"></i> Действия логова</h5>
                <div class="lair-actions-list">
                    ${creature.lairActions.map((action, idx) => `
                        <div class="action-item">
                            ${action}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Кнопка изменения цвета
    html += `
        <div class="section">
            <h5><i class="fas fa-palette"></i> Изменить цвет</h5>
            <div class="color-picker">
                ${defaultColors.map(color => `
                    <div class="color-option ${creature.color === color ? 'selected' : ''}" 
                         style="background: ${color};" 
                         onclick="changeCreatureColor(${state.currentCreature}, '${color}')"></div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Информация о группе
    if (isGroupMember) {
        html += `
            <div class="section">
                <h5><i class="fas fa-users"></i> Управление группой</h5>
                <div style="display: flex; gap: 10px;">
                    <button onclick="ungroupCreature(${state.currentCreature})" class="btn btn-sm btn-warning">
                        <i class="fas fa-sign-out-alt"></i> Вывести из группы
                    </button>
                </div>
            </div>
        `;
    }
    
    html += `</div>`;
    
    document.getElementById('creature-details').innerHTML = html;
}

// ============ ВРЕМЕННЫЕ ХИТЫ ============

function showTempHPModal() {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) return;
    
    document.getElementById('current-temp-hp').textContent = creature.tempHP;
    document.getElementById('temp-hp-amount').value = Math.max(5, creature.tempHP + 5);
    showModal('temp-hp-modal');
}

function applyTempHP() {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) return;
    
    const amount = parseInt(document.getElementById('temp-hp-amount').value);
    const action = document.getElementById('temp-hp-action').value;
    
    if (isNaN(amount) || amount < 0) {
        alert('Введите корректное количество');
        return;
    }
    
    let newTempHP = creature.tempHP;
    let message = '';
    
    switch(action) {
        case 'set':
            newTempHP = amount;
            message = `Временные HP установлены на ${amount}`;
            break;
        case 'add':
            newTempHP += amount;
            message = `Добавлено ${amount} временных HP`;
            break;
        case 'replace':
            newTempHP = Math.max(creature.tempHP, amount);
            if (amount > creature.tempHP) {
                message = `Временные HP заменены на ${amount} (больше предыдущих)`;
            } else {
                message = `Временные HP оставлены прежними (${creature.tempHP})`;
            }
            break;
        case 'remove':
            newTempHP = 0;
            message = `Временные HP удалены`;
            break;
    }
    
    creature.tempHP = newTempHP;
    addToLog(`${creature.name}: ${message}`);
    
    closeModal('temp-hp-modal');
    renderBattle();
    renderCreatureDetails();
    saveToLocalStorage();
}

function addTempHP(amount, action = 'add') {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) return;
    
    if (action === 'add') {
        creature.tempHP += amount;
        addToLog(`${creature.name} получил ${amount} временных HP`);
    } else if (action === 'set') {
        creature.tempHP = Math.max(creature.tempHP, amount);
        if (amount > creature.tempHP) {
            addToLog(`${creature.name} получил ${amount} временных HP (заменил старые)`);
        }
    }
    
    renderBattle();
    renderCreatureDetails();
    saveToLocalStorage();
}

function clearTempHP() {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) return;
    
    creature.tempHP = 0;
    addToLog(`${creature.name} потерял все временные HP`);
    
    renderBattle();
    renderCreatureDetails();
    saveToLocalStorage();
}

// ============ РЕДАКТИРОВАНИЕ СУЩЕСТВА ============

function showEditCreatureModal(index) {
    const creature = state.battle.participants[index];
    if (!creature) return;
    
    state.editCreatureIndex = index;
    
    // Заполняем форму данными существа
    document.getElementById('edit-name').value = creature.name;
    document.getElementById('edit-ac').value = creature.ac;
    document.getElementById('edit-attack-bonus').value = creature.attackBonus;
    document.getElementById('edit-damage').value = creature.damage;
    document.getElementById('edit-damage-type').value = creature.damageType;
    document.getElementById('edit-resistances').value = creature.resistances ? creature.resistances.join(', ') : '';
    document.getElementById('edit-immunities').value = creature.immunities ? creature.immunities.join(', ') : '';
    document.getElementById('edit-vulnerabilities').value = creature.vulnerabilities ? creature.vulnerabilities.join(', ') : '';
    document.getElementById('edit-multiattack').value = creature.multiattack || '';
    document.getElementById('edit-legendary-actions').value = creature.legendaryActions ? creature.legendaryActions.join('|') : '';
    document.getElementById('edit-lair-actions').value = creature.lairActions ? creature.lairActions.join('|') : '';
    document.getElementById('edit-color').value = creature.color;
    
    // Выбираем правильный цвет в пикере
    document.querySelectorAll('#color-picker .color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === creature.color) {
            opt.classList.add('selected');
        }
    });
    
    showModal('edit-creature-modal');
}

function saveCreatureEdit() {
    if (state.editCreatureIndex === null) return;
    
    const creature = state.battle.participants[state.editCreatureIndex];
    if (!creature) return;
    
    const oldName = creature.name;
    
    // Сохраняем изменения (кроме HP и инициативы)
    creature.name = document.getElementById('edit-name').value.trim() || creature.name;
    creature.ac = parseInt(document.getElementById('edit-ac').value) || creature.ac;
    creature.attackBonus = parseInt(document.getElementById('edit-attack-bonus').value) || creature.attackBonus;
    creature.damage = document.getElementById('edit-damage').value.trim() || creature.damage;
    creature.damageType = document.getElementById('edit-damage-type').value;
    creature.resistances = parseDamageTypes(document.getElementById('edit-resistances').value);
    creature.immunities = parseDamageTypes(document.getElementById('edit-immunities').value);
    creature.vulnerabilities = parseDamageTypes(document.getElementById('edit-vulnerabilities').value);
    creature.multiattack = document.getElementById('edit-multiattack').value.trim();
    creature.legendaryActions = parseActions(document.getElementById('edit-legendary-actions').value);
    creature.lairActions = parseActions(document.getElementById('edit-lair-actions').value);
    creature.color = document.getElementById('edit-color').value;
    
    addToLog(`Существо "${oldName}" отредактировано`);
    
    closeModal('edit-creature-modal');
    state.editCreatureIndex = null;
    
    renderBattle();
    renderCreatureDetails();
    saveToLocalStorage();
}

function changeCreatureColor(index, color = null) {
    const creature = state.battle.participants[index];
    if (!creature) return;
    
    if (!color) {
        // Если цвет не передан, показываем выбор
        const newColor = prompt('Введите цвет в формате HEX (например, #3498db):', creature.color);
        if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
            creature.color = newColor;
        } else if (newColor) {
            alert('Некорректный формат цвета. Используйте HEX, например: #3498db');
        }
    } else {
        creature.color = color;
    }
    
    renderBattle();
    if (state.currentCreature === index) {
        renderCreatureDetails();
    }
    saveToLocalStorage();
}

// ============ УРОН И СОСТОЯНИЯ ============

// Применение урона с учетом временных хитов
function applyDamage() {
    const amount = parseInt(document.getElementById('damage-amount').value);
    const type = document.getElementById('damage-type').value;
    
    if (isNaN(amount)) {
        alert('Введите корректное количество');
        return;
    }
    
    if (state.currentCreature !== null) {
        const creature = state.battle.participants[state.currentCreature];
        let damageAmount = Math.abs(amount);
        
        // Учитываем резисты/иммунитеты/уязвимости
        if (type !== 'healing') {
            if (creature.immunities && creature.immunities.includes(type)) {
                damageAmount = 0;
                addToLog(`${creature.name} иммунен к ${type} урону`);
            } else if (creature.resistances && creature.resistances.includes(type)) {
                damageAmount = Math.floor(damageAmount / 2);
                addToLog(`${creature.name} имеет сопротивление к ${type} (половина урона)`);
            } else if (creature.vulnerabilities && creature.vulnerabilities.includes(type)) {
                damageAmount = damageAmount * 2;
                addToLog(`${creature.name} уязвим к ${type} (двойной урон)`);
            }
        }
        
        if (type === 'healing') {
            // Лечение не восстанавливает временные хиты
            creature.currentHP += damageAmount;
            if (creature.currentHP > creature.maxHP) creature.currentHP = creature.maxHP;
            addToLog(`${creature.name} вылечен на ${damageAmount} HP`);
        } else {
            // Учет временных хитов
            if (creature.tempHP > 0) {
                const damageToTemp = Math.min(damageAmount, creature.tempHP);
                creature.tempHP -= damageToTemp;
                damageAmount -= damageToTemp;
                
                addToLog(`${creature.name} потерял ${damageToTemp} временных HP`);
                
                if (damageAmount <= 0) {
                    addToLog(`Урон полностью поглощен временными HP`);
                }
            }
            
            // Оставшийся урон идет на обычные хиты
            if (damageAmount > 0) {
                creature.currentHP -= damageAmount;
                if (creature.currentHP < 0) creature.currentHP = 0;
                addToLog(`${creature.name} получил ${damageAmount} урона (${type})`);
            }
        }
        
        // Проверка на смерть
        if (creature.currentHP <= 0) {
            addToLog(`💀 ${creature.name} погиб!`);
        }
        
        saveToLocalStorage();
        renderBattle();
        renderCreatureDetails();
    }
    
    closeModal('damage-modal');
}

// Добавление состояния
function addCondition() {
    if (state.currentCreature === null) return;
    
    const name = document.getElementById('condition-select').value;
    const duration = parseInt(document.getElementById('condition-duration').value);
    const creature = state.battle.participants[state.currentCreature];
    
    if (isNaN(duration) || duration < 1) {
        alert('Введите корректную длительность');
        return;
    }
    
    // Проверяем, есть ли уже такое состояние
    const existingIndex = creature.conditions.findIndex(c => c.name === name);
    if (existingIndex !== -1) {
        creature.conditions[existingIndex].duration = duration;
    } else {
        creature.conditions.push({ name, duration });
    }
    
    addToLog(`${creature.name} получил состояние: ${name} на ${duration} ходов`);
    
    closeModal('condition-modal');
    saveToLocalStorage();
    renderCreatureDetails();
}

// Удаление состояния
function removeCondition(conditionIndex) {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) return;
    
    const conditionName = creature.conditions[conditionIndex].name;
    creature.conditions.splice(conditionIndex, 1);
    addToLog(`${creature.name} больше не ${conditionName}`);
    
    saveToLocalStorage();
    renderCreatureDetails();
}

// ============ БРОСКИ КУБОВ ============

// Бросок кубов
function rollDice(dice) {
    const match = dice.match(/d(\d+)/);
    if (!match) return;
    
    const sides = parseInt(match[1]);
    const result = Math.floor(Math.random() * sides) + 1;
    
    const message = `Бросок ${dice}: <strong>${result}</strong>`;
    showRollResult(message);
    addToLog(`Бросок ${dice}: ${result}`);
}

// Произвольный бросок
function rollCustom() {
    const input = document.getElementById('custom-roll').value;
    if (!input.trim()) {
        alert('Введите выражение для броска');
        return;
    }
    
    try {
        const result = evalDiceExpression(input);
        const message = `<strong>Бросок ${input}: ${result}</strong>`;
        showRollResult(message);
        addToLog(`Бросок ${input}: ${result}`);
    } catch (e) {
        alert('Ошибка в выражении: ' + e.message);
    }
}

// Вычисление выражения с кубами
function evalDiceExpression(expr) {
    // Заменяем d на случайное число
    const diceRegex = /(\d+)d(\d+)/g;
    let match;
    while ((match = diceRegex.exec(expr)) !== null) {
        const count = parseInt(match[1]);
        const sides = parseInt(match[2]);
        let total = 0;
        for (let i = 0; i < count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        expr = expr.replace(match[0], total);
    }
    
    // Вычисляем оставшееся выражение
    return eval(expr);
}

// Массовый бросок
function rollMass() {
    const input = document.getElementById('mass-roll').value;
    if (!input.trim()) {
        alert('Введите выражение для массового броска');
        return;
    }
    
    const result = evalDiceExpression(input);
    
    const message = `Массовый бросок ${input}: <strong>${result}</strong>`;
    showRollResult(message);
    addToLog(`Массовый бросок ${input}: ${result}`);
}

// Преимущество/помеха
function rollAdvantage() {
    const roll1 = Math.floor(Math.random() * 20) + 1;
    const roll2 = Math.floor(Math.random() * 20) + 1;
    const result = Math.max(roll1, roll2);
    
    const message = `Преимущество: <strong>${result}</strong><br>
                    <small>${roll1}, ${roll2} (выбран лучший)</small>`;
    
    showRollResult(message, roll1 === 20 || roll2 === 20 ? 'critical' : 'normal');
    addToLog(`Бросок с преимуществом: ${result} (${roll1}, ${roll2})`);
}

function rollDisadvantage() {
    const roll1 = Math.floor(Math.random() * 20) + 1;
    const roll2 = Math.floor(Math.random() * 20) + 1;
    const result = Math.min(roll1, roll2);
    
    const message = `Помеха: <strong>${result}</strong><br>
                    <small>${roll1}, ${roll2} (выбран худший)</small>`;
    
    showRollResult(message, 'normal');
    addToLog(`Бросок с помехой: ${result} (${roll1}, ${roll2})`);
}

// Показ результата броска
function showRollResult(message, type = 'normal') {
    const resultDiv = document.getElementById('roll-result');
    resultDiv.innerHTML = message;
    resultDiv.className = `roll-result ${type}`;
}

// Бросок атаки
function rollAttack() {
    const creature = state.battle.participants[state.currentCreature];
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + (creature.attackBonus || 0);
    
    let isCrit = roll === 20;
    let isFumble = roll === 1;
    
    const message = `
        Атака ${creature.name}: <strong>${total}</strong> (${roll} + ${creature.attackBonus})
        ${isCrit ? '<br><span style="color: #e74c3c;">🎯 КРИТИЧЕСКИЙ УДАР!</span>' : ''}
        ${isFumble ? '<br><span style="color: #c0392b;">💥 КРИТИЧЕСКИЙ ПРОВАЛ!</span>' : ''}
    `;
    
    showRollResult(message, isCrit ? 'critical' : isFumble ? 'danger' : 'normal');
    addToLog(`Атака ${creature.name}: ${total} (${roll} + ${creature.attackBonus})`);
    
    // Автоматический бросок урона при критическом ударе
    if (isCrit && creature.damage) {
        setTimeout(() => rollDamage(true), 1000);
    }
}

// Бросок урона (с поддержкой крита)
function rollDamage(isCrit = false) {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature.damage) return;
    
    let damageExpr = creature.damage;
    
    // Если крит, удваиваем количество кубов
    if (isCrit) {
        damageExpr = damageExpr.replace(/(\d+)d(\d+)/g, (match, count, sides) => {
            return `${parseInt(count) * 2}d${sides}`;
        });
    }
    
    try {
        const result = evalDiceExpression(damageExpr);
        const message = `<strong>Урон ${creature.name}: ${result} ${creature.damageType}</strong>`;
        showRollResult(message, isCrit ? 'critical' : 'normal');
        addToLog(`${creature.name} наносит ${result} ${creature.damageType} урона${isCrit ? ' (крит!)' : ''}`);
    } catch (e) {
        alert('Ошибка в выражении урона: ' + e.message);
    }
}
function saveBattleStateToHistory() {
    // Можно сохранять состояние для возможного отката
    // Пока просто оставляем как заглушку
}
// ============ СБРОС БОЯ ============

function resetBattle() {
    if (!confirm('Сбросить бой в начальное состояние?\n\nЭто вернет все HP к максимуму, обнулит временные HP, состояния, и сбросит раунды, но сохранит существ в инициативе.')) {
        return;
    }
    
    // Сохраняем оригинальные данные существ из бестиария для восстановления HP
    const creatureResetMap = {};
    state.creatures.forEach(cr => {
        creatureResetMap[cr.id] = {
            maxHP: cr.maxHP,
            ac: cr.ac,
            attackBonus: cr.attackBonus,
            damage: cr.damage,
            damageType: cr.damageType,
            resistances: [...(cr.resistances || [])],
            immunities: [...(cr.immunities || [])],
            vulnerabilities: [...(cr.vulnerabilities || [])]
        };
    });
    
    // Восстанавливаем каждого участника боя
    state.battle.participants.forEach(participant => {
        // Находим оригинальное существо в бестиарии
        const original = state.creatures.find(c => c.id === participant.id);
        const resetData = creatureResetMap[participant.id];
        
        if (resetData) {
            // Восстанавливаем HP
            participant.currentHP = resetData.maxHP;
            participant.maxHP = resetData.maxHP;
            
            // Восстанавливаем другие параметры из оригинала
            participant.ac = resetData.ac;
            participant.attackBonus = resetData.attackBonus;
            participant.damage = resetData.damage;
            participant.damageType = resetData.damageType;
            participant.resistances = [...resetData.resistances];
            participant.immunities = [...resetData.immunities];
            participant.vulnerabilities = [...resetData.vulnerabilities];
        } else if (original) {
            // Для существ, у которых нет id из бестиария, но есть совпадение по имени
            participant.currentHP = original.maxHP;
            participant.maxHP = original.maxHP;
        } else {
            // Для быстрых NPC используем текущее maxHP
            participant.currentHP = participant.maxHP;
        }
        
        // Сбрасываем временные HP
        participant.tempHP = 0;
        
        // Сбрасываем состояния
        participant.conditions = [];
        
        // Сбрасываем концентрацию
        participant.concentration = false;
        
        // Сбрасываем использованные действия
        participant.usedLegendaryActions = 0;
        participant.usedLairActions = false;
    });
    
    // Сбрасываем раунд и текущий ход
    state.battle.round = 1;
    state.battle.currentTurn = 0;
    
    // Переброс инициативы (опционально, можно закомментировать если нужно сохранить инициативу)
    // rollAllInitiative();
    
    // Очищаем историю боя
    state.battle.log = [];
    document.getElementById('battle-log').innerHTML = '';
    
    // Обновляем отображение
    renderBattle();
    updateRoundDisplay();
    saveToLocalStorage();
    
    addToLog('=== БОЙ СБРОШЕН В НАЧАЛЬНОЕ СОСТОЯНИЕ ===');
    addToLog('Все HP восстановлены, состояния сброшены');
}

// ============ БЫСТРЫЙ NPC ============

function showQuickNPCModal() {
    document.getElementById('quick-npc-name').value = '';
    document.getElementById('quick-npc-hp').value = '';
    document.getElementById('quick-npc-ac').value = '';
    document.getElementById('quick-npc-initiative').value = '';
    document.getElementById('quick-npc-color').value = '#3498db';
    
    // Сбрасываем цветовой пикер
    document.querySelectorAll('#quick-npc-modal .color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === '#3498db') {
            opt.classList.add('selected');
        }
    });
    
    showModal('quick-npc-modal');
}

function addQuickNPC() {
    const name = document.getElementById('quick-npc-name').value.trim() || 'NPC';
    const hp = parseInt(document.getElementById('quick-npc-hp').value) || 10;
    const ac = parseInt(document.getElementById('quick-npc-ac').value) || 12;
    let initiative = parseInt(document.getElementById('quick-npc-initiative').value);
    const color = document.getElementById('quick-npc-color').value || '#3498db';
    
    if (isNaN(initiative)) {
        initiative = rollInitiative();
    }
    
    const creature = {
        id: Date.now(),
        name: name,
        baseName: name,
        maxHP: hp,
        currentHP: hp,
        ac: ac,
        initiative: initiative,
        initBonus: 0,
        attackBonus: 3,
        damage: '1d6+1',
        damageType: 'slashing',
        tempHP: 0,
        conditions: [],
        concentration: false,
        resistances: [],
        immunities: [],
        vulnerabilities: [],
        groupId: null,
        groupNumber: 0,
        color: color
    };
    
    state.battle.participants.push(creature);
    sortInitiative();
    renderBattle();
    updateContextCreatures();
    saveToLocalStorage();
    
    addToLog(`Быстрый NPC "${name}" добавлен в бой`);
    closeModal('quick-npc-modal');
}

// ============ УПРАВЛЕНИЕ ХОДОМ ============

function nextTurn() {
    if (state.battle.participants.length === 0) return;    
    saveBattleStateToHistory();
    
    const current = state.battle.participants[state.battle.currentTurn];
    if (current) {
        current.conditions = current.conditions.filter(cond => {
            cond.duration--;
            return cond.duration > 0;
        });
    }
    
    // Переходим к следующему существу
    state.battle.currentTurn++;
    
    if (state.battle.currentTurn >= state.battle.participants.length) {
        newRound();
        return;
    }
    
    renderBattle();
    saveToLocalStorage();
    
    const newCurrent = state.battle.participants[state.battle.currentTurn];
    addToLog(`Ход: ${newCurrent ? newCurrent.name : '???'}`);
}



function previousTurn() {
    if (state.battle.participants.length === 0) return;
    
    // Увеличиваем длительность состояний у текущего существа
    const current = state.battle.participants[state.battle.currentTurn];
    if (current) {
        current.conditions.forEach(cond => {
            cond.duration++;
        });
    }
    
    state.battle.currentTurn = (state.battle.currentTurn - 1 + state.battle.participants.length) % state.battle.participants.length;
    
    // Если вернулись к последнему существу - уменьшаем раунд
    if (state.battle.currentTurn === state.battle.participants.length - 1) {
        if (state.battle.round > 1) {
            state.battle.round--;
            addToLog(`=== Откат к раунду ${state.battle.round} ===`);
        }
    }
    
    renderBattle();
    saveToLocalStorage();
    
    const newCurrent = state.battle.participants[state.battle.currentTurn];
    addToLog(`Вернулись к: ${newCurrent ? newCurrent.name : '???'}`);
}

function newRound() {
    saveBattleStateToHistory();
    
    state.battle.round++;
    state.battle.currentTurn = 0;
    
    // Уменьшаем длительность всех состояний у всех существ
    state.battle.participants.forEach(creature => {
        creature.conditions = creature.conditions.filter(cond => {
            cond.duration--;
            return cond.duration > 0;
        });
        creature.usedLegendaryActions = 0;
        creature.usedLairActions = false;
    });
    
    updateRoundDisplay();
    saveToLocalStorage();
    addToLog(`=== Начало раунда ${state.battle.round} ===`);
    
    renderBattle();

    const currentCreature = state.battle.participants[state.battle.currentTurn];
    if (currentCreature) {
        addToLog(`Ход: ${currentCreature.name}`);
    }
}

function updateRoundDisplay() {
    document.getElementById('round-count').textContent = state.battle.round;
}

// ============ МОДАЛЬНЫЕ ОКНА ============
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // Сброс полей
    if (modalId === 'damage-modal') {
        document.getElementById('damage-amount').value = '';
    }
}

function showDamageModal() {
    document.getElementById('damage-type').value = 'slashing';
    showModal('damage-modal');
}

function showHealingModal() {
    document.getElementById('damage-type').value = 'healing';
    showModal('damage-modal');
}

function showConditionModal() {
    showModal('condition-modal');
}

// ============ КОНТЕКСТНЫЙ БРОСОК ============

function updateContextCreatures() {
    const select = document.getElementById('context-creature');
    if (!select) return;
    
    select.innerHTML = '<option value="">Выберите существо</option>';
    
    state.battle.participants.forEach((creature, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = creature.name;
        select.appendChild(option);
    });
}

function contextRoll() {
    const creatureIndex = document.getElementById('context-creature').value;
    const rollType = document.getElementById('context-roll-type').value;
    const skill = document.getElementById('context-skill').value;
    
    if (creatureIndex === '') {
        alert('Выберите существо');
        return;
    }
    
    const creature = state.battle.participants[creatureIndex];
    let roll = Math.floor(Math.random() * 20) + 1;
    let bonus = 0;
    let message = '';
    
    switch(rollType) {
        case 'attack':
            bonus = creature.attackBonus || 0;
            message = `Атака ${creature.name}: ${roll + bonus} (${roll} + ${bonus})`;
            break;
        case 'save':
            bonus = Math.floor((creature.attackBonus || 0) / 2);
            message = `Спасбросок ${creature.name} (${skill}): ${roll + bonus} (${roll} + ${bonus})`;
            break;
        case 'skill':
            bonus = Math.floor((creature.attackBonus || 0) / 2);
            message = `Проверка ${creature.name} (${skill}): ${roll + bonus} (${roll} + ${bonus})`;
            break;
    }
    
    const isCrit = roll === 20;
    const isFumble = roll === 1;
    
    let resultMessage = message;
    if (isCrit) resultMessage += '<br><span style="color: #e74c3c;">🎯 КРИТИЧЕСКИЙ УСПЕХ!</span>';
    if (isFumble) resultMessage += '<br><span style="color: #c0392b;">💥 КРИТИЧЕСКИЙ ПРОВАЛ!</span>';
    
    showRollResult(resultMessage, isCrit ? 'critical' : isFumble ? 'danger' : 'normal');
    addToLog(message);
}

// ============ ЛОГ БОЯ ============

function addToLog(message) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const entry = `<div class="log-entry">[${timestamp}] ${message}</div>`;
    
    const logContainer = document.getElementById('battle-log');
    logContainer.insertAdjacentHTML('afterbegin', entry);
    
    state.battle.log.unshift(`[${timestamp}] ${message}`);
    if (state.battle.log.length > 100) {
        state.battle.log.pop();
    }
    
    saveToLocalStorage();
}

function clearBattleLog() {
    if (confirm('Очистить историю боя?')) {
        state.battle.log = [];
        document.getElementById('battle-log').innerHTML = '';
        saveToLocalStorage();
    }
}

// ============ СТАТИСТИКА БОЯ ============

function updateBattleStats() {
    const stats = document.getElementById('battle-stats');
    if (!stats) return;
    
    const participants = state.battle.participants;
    const alive = participants.filter(c => c.currentHP > 0).length;
    const dead = participants.filter(c => c.currentHP <= 0).length;
    const totalHP = participants.reduce((sum, c) => sum + c.currentHP, 0);
    const avgHP = participants.length > 0 ? Math.round(totalHP / participants.length) : 0;
    
    stats.innerHTML = `
        <div style="margin-bottom: 15px;">
            <div><strong>Всего существ:</strong> ${participants.length}</div>
            <div><strong>Живых:</strong> ${alive}</div>
            <div><strong>Мёртвых:</strong> ${dead}</div>
            <div><strong>Среднее HP:</strong> ${avgHP}</div>
        </div>
    `;
}

// ============ ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ============

function saveToLocalStorage() {
    try {
        localStorage.setItem('dnd_creatures', JSON.stringify(state.creatures));
        localStorage.setItem('dnd_battle', JSON.stringify(state.battle));
        localStorage.setItem('dnd_groups', JSON.stringify(state.groups));
    } catch (e) {
        console.error('Ошибка сохранения в localStorage:', e);
    }
}

function backupData() {
    saveToLocalStorage();
    alert('Данные сохранены в localStorage браузера');
}

function clearSession() {
    if (confirm('Вы уверены? Это удалит ВСЕ данные (бой, существ, историю).')) {
        localStorage.clear();
        state.creatures = [];
        state.battle = {
            participants: [],
            currentTurn: 0,
            round: 1,
            log: [],
            groups: {}
        };
        state.groups = {};
        state.currentCreature = null;
        state.editingCreatureId = null;
        state.editCreatureIndex = null;
        
        renderBattle();
        renderSavedCreatures();
        updateContextCreatures();
        resetCreatureForm();
        
        addToLog('Все данные очищены');
    }
}

function deleteCreature(creatureId) {
    if (confirm('Удалить это существо из бестиария?')) {
        state.creatures = state.creatures.filter(c => c.id !== creatureId);
        saveToLocalStorage();
        renderSavedCreatures();
        addToLog('Существо удалено из бестиария');
    }
}

function saveSession() {
    saveToLocalStorage();
    
    const dataStr = JSON.stringify({
        creatures: state.creatures,
        battle: state.battle,
        groups: state.groups,
        timestamp: new Date().toISOString()
    });
    
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportLink = document.createElement('a');
    exportLink.setAttribute('href', dataUri);
    exportLink.setAttribute('download', `dnd_session_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(exportLink);
    exportLink.click();
    document.body.removeChild(exportLink);
    
    addToLog('Сессия экспортирована в файл');
}

function loadSession() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function() {
            try {
                const loadedData = JSON.parse(reader.result);
                
                if (loadedData.creatures) {
                    state.creatures = loadedData.creatures;
                }
                
                if (loadedData.battle) {
                    state.battle = loadedData.battle;
                }
                
                if (loadedData.groups) {
                    state.groups = loadedData.groups;
                }
                
                saveToLocalStorage();
                renderBattle();
                renderSavedCreatures();
                updateContextCreatures();
                
                addToLog(`Сессия загружена из файла (${file.name})`);
            } catch (err) {
                alert('Ошибка загрузки файла: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// Включение редактирования КД
function enableACEdit(index) {
    const display = document.getElementById(`ac-display-${index}`);
    const edit = document.getElementById(`ac-edit-${index}`);
    
    if (display && edit) {
        display.style.display = 'none';
        edit.style.display = 'inline-block';
        edit.focus();
        edit.select();
    }
}

// Сохранение нового значения КД
function saveAC(index) {
    const display = document.getElementById(`ac-display-${index}`);
    const edit = document.getElementById(`ac-edit-${index}`);
    
    if (!display || !edit) return;
    
    const newAC = parseInt(edit.value);
    if (isNaN(newAC) || newAC < 0) {
        alert('Введите корректное значение КД');
        edit.focus();
        return;
    }
    
    const creature = state.battle.participants[index];
    if (!creature) return;
    
    const oldAC = creature.ac;
    creature.ac = newAC;
    
    // Обновляем отображение
    display.textContent = newAC;
    display.style.display = 'inline-block';
    edit.style.display = 'none';
    
    // Логируем изменение
    if (oldAC !== newAC) {
        addToLog(`${creature.name}: КД изменено с ${oldAC} на ${newAC}`);
    }
    
    // Обновляем отображение в трекере инициативы
    renderBattle();
    saveToLocalStorage();
}

// Функция для быстрого изменения КД
function changeAC(index, amount) {
    const creature = state.battle.participants[index];
    if (!creature) return;
    
    const oldAC = creature.ac;
    creature.ac = Math.max(0, oldAC + amount);
    
    // Обновляем отображение в деталях
    const display = document.getElementById(`ac-display-${index}`);
    if (display) {
        display.textContent = creature.ac;
    }
    
    // Логируем изменение
    const changeText = amount >= 0 ? `+${amount}` : amount;
    addToLog(`${creature.name}: КД изменено ${changeText} (с ${oldAC} на ${creature.ac})`);
    
    // Обновляем отображение в трекере
    renderBattle();
    saveToLocalStorage();
}

