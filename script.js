// Глобальные переменные состояния
const state = {
    creatures: JSON.parse(localStorage.getItem('dnd_creatures')) || [],
    battle: JSON.parse(localStorage.getItem('dnd_battle')) || {
        participants: [],
        currentTurn: 0,
        round: 1,
        log: [],
        groups: {},
        history: [],
        historyIndex: -1
    },
    groups: JSON.parse(localStorage.getItem('dnd_groups')) || {},
    currentCreature: null,
    dragItem: null,
    dragType: null,
    editInitiativeIndex: null,
    editingCreatureId: null,
    conditionsCollapsed: false,
    editCreatureIndex: null
};

const CONDITIONS = {
    'blinded': {
        name: 'Ослеплён',
        description: 'Не видит, автоматически проваливает проверки, связанные со зрением.',
        effects: [
            'Атаки по существу: преимущество',
            'Атаки существа: помеха'
        ],
        maxDuration: 100,
        canBePermanent: true,
        defaultDuration: 1,
        type: 'normal'
    },
    'charmed': {
        name: 'Очарован',
        description: 'Не может атаковать очаровавшего, тот имеет преимущество в социальных взаимодействиях.',
        effects: [
            'Не может атаковать очаровавшего',
            'Очаровавший имеет преимущество в социальных проверках'
        ],
        maxDuration: 100,
        canBePermanent: true,
        defaultDuration: 1,
        type: 'normal'
    },
    'frightened': {
        name: 'Испуган',
        description: 'Помеха на проверки и атаки, не может добровольно приближаться к источнику страха.',
        effects: [
            'Помеха на проверки характеристик',
            'Помеха на броски атаки',
            'Не может приближаться к источнику страха'
        ],
        maxDuration: 100,
        canBePermanent: false,
        defaultDuration: 1,
        type: 'normal'
    },
    'grappled': {
        name: 'Схвачен',
        description: 'Скорость 0, состояние оканчивается если схвативший становится недееспособным.',
        effects: [
            'Скорость = 0',
            'Без бонусов к скорости'
        ],
        maxDuration: null,
        canBePermanent: true,
        defaultDuration: null,
        type: 'special'
    },
    'paralyzed': {
        name: 'Парализован',
        description: 'Недееспособен, не может двигаться и говорить. Автопровал спасбросков Силы и Ловкости.',
        effects: [
            'Недееспособен',
            'Скорость = 0',
            'Автопровал спасбросков Силы и Ловкости',
            'Атаки по существу: преимущество',
            'Крит при атаке в ближнем бою'
        ],
        maxDuration: 100,
        canBePermanent: false,
        defaultDuration: 1,
        type: 'normal'
    },
    'petrified': {
        name: 'Окаменевший',
        description: 'Превращён в камень, недееспособен, получает сопротивления ко всем видам урона.',
        effects: [
            'Недееспособен',
            'Скорость = 0',
            'Автопровал спасбросков Силы и Ловкости',
            'Атаки по существу: преимущество',
            'Сопротивление ко всем видам урона',
            'Иммунитет к ядам и болезням'
        ],
        maxDuration: null,
        canBePermanent: true,
        defaultDuration: null,
        type: 'permanent'
    },
    'poisoned': {
        name: 'Отравлен',
        description: 'Помеха на броски атаки и проверки характеристик.',
        effects: [
            'Помеха на броски атаки',
            'Помеха на проверки характеристик'
        ],
        maxDuration: 100,
        canBePermanent: false,
        defaultDuration: 1,
        type: 'normal'
    },
    'prone': {
        name: 'Лежит (сбит с ног)',
        description: 'Может двигаться только ползком, помеха на атаки, преимущество для атакующих вблизи.',
        effects: [
            'Может двигаться только ползком',
            'Помеха на броски атаки',
            'Атаки по существу: преимущество (в 5 футах)',
            'Атаки по существу: помеха (дальше 5 футов)'
        ],
        maxDuration: null,
        canBePermanent: false,
        defaultDuration: null,
        type: 'special'
    },
    'restrained': {
        name: 'Скован',
        description: 'Скорость 0, помеха на спасброски Ловкости, преимущество для атакующих.',
        effects: [
            'Скорость = 0',
            'Без бонусов к скорости',
            'Атаки по существу: преимущество',
            'Атаки существа: помеха',
            'Помеха на спасброски Ловкости'
        ],
        maxDuration: 100,
        canBePermanent: false,
        defaultDuration: 1,
        type: 'normal'
    },
    'stunned': {
        name: 'Оглушён',
        description: 'Недееспособен, не может двигаться, говорит запинаясь.',
        effects: [
            'Недееспособен',
            'Скорость = 0',
            'Автопровал спасбросков Силы и Ловкости',
            'Атаки по существу: преимущество'
        ],
        maxDuration: 100,
        canBePermanent: false,
        defaultDuration: 1,
        type: 'normal'
    },
    'unconscious': {
        name: 'Бессознателен',
        description: 'Недееспособен, не может двигаться и говорит, роняет всё что держит.',
        effects: [
            'Недееспособен',
            'Скорость = 0',
            'Автопровал спасбросков Силы и Ловкости',
            'Атаки по существу: преимущество',
            'Крит при атаке в ближнем бою'
        ],
        maxDuration: null,
        canBePermanent: true,
        defaultDuration: null,
        type: 'permanent'
    },
    'invisible': {
        name: 'Невидим',
        description: 'Невозможно увидеть без магии или особого чувства. Считается сильно заслонённым.',
        effects: [
            'Атаки по существу: помеха',
            'Атаки существа: преимущество'
        ],
        maxDuration: 100,
        canBePermanent: true,
        defaultDuration: 1,
        type: 'normal'
    },
    'deafened': {
        name: 'Оглохший',
        description: 'Ничего не слышит, автоматически проваливает проверки связанные со слухом.',
        effects: [
            'Автопровал проверок на слух'
        ],
        maxDuration: 100,
        canBePermanent: true,
        defaultDuration: 1,
        type: 'normal'
    },
    'exhaustion': {
        name: 'Истощённый',
        description: 'Шесть степеней истощения с различными эффектами.',
        effects: [],
        maxDuration: null,
        canBePermanent: true,
        defaultDuration: null,
        type: 'exhaustion',
        hasLevels: true,
        maxLevel: 6,
        levelEffects: {
            1: 'Помеха на проверки характеристик',
            2: 'Скорость уменьшена вдвое',
            3: 'Помеха на броски атаки и спасброски',
            4: 'Максимум хитов уменьшен вдвое',
            5: 'Скорость = 0',
            6: 'Смерть'
        }
    },
    'incapacitated': {
        name: 'Недееспособный',
        description: 'Не может совершать действия и реакции, теряет концентрацию.',
        effects: [
            'Не может совершать действия',
            'Не может использовать реакции',
            'Теряет концентрацию',
            'Автопровал проверок против захвата/толчка'
        ],
        maxDuration: 100,
        canBePermanent: false,
        defaultDuration: 1,
        type: 'normal'
    },
    'concentration': {
        name: 'Концентрация',
        description: 'Сконцентрирован на заклинании или способности. Теряется при уроне или недееспособности.',
        effects: [
            'Концентрация на эффекте'
        ],
        maxDuration: null,
        canBePermanent: true,
        defaultDuration: null,
        type: 'special'
    }
};

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
    '#ffeb3b', '#ffff00', '#cddc39', '#f6d365',
    '#e74c3c', '#ff5722', '#e91e63', '#ff00aa', '#ff9a9e',
    '#fda085', '#fbcfe8', '#ffdde1', '#fad3d3', '#fad0c4',
    '#a1887f', '#bcaaa4', '#d7ccc8', '#efebe9', '#6d4c41',
    '#8d6e63', '#e17055', '#fdcb6e'
];

// ============ ИНИЦИАЛИЗАЦИЯ ============
document.addEventListener('DOMContentLoaded', function () {
    console.log('D&D Combat Master загружен');

    initTabs();
    renderSavedCreatures();
    renderBattle();
    updateContextCreatures();
    initColorPickers();
    initConditionListeners();

    setInterval(saveToLocalStorage, 3000);

    if (state.battle.participants.length > 0) {
        updateRoundDisplay();
        addToLog('Сессия восстановлена из сохранения');

        // Применяем эффекты состояний ко всем существам при загрузке
        state.battle.participants.forEach(creature => {
            applyConditionEffects(creature);
        });
    }

    const searchInput = document.getElementById('creature-search');
    if (searchInput) {
        searchInput.addEventListener('input', renderSavedCreatures);
    }

    state.battle.participants.forEach(creature => {
        if (!creature.deathSaves) {
            creature.deathSaves = { successes: 0, failures: 0 };
            creature.stabilized = false;
            creature.dead = false;
        }
    });
});

function initConditionListeners() {
    const conditionSelect = document.getElementById('condition-select');
    if (conditionSelect) {
        conditionSelect.addEventListener('change', function () {
            const conditionKey = this.value;
            const conditionInfo = CONDITIONS[conditionKey];

            const exhaustionGroup = document.getElementById('exhaustion-level-group');
            exhaustionGroup.style.display = conditionKey === 'exhaustion' ? 'block' : 'none';

            const durationGroup = document.getElementById('condition-duration-group');
            const typeGroup = document.getElementById('condition-type-group');

            if (conditionInfo) {
                if (conditionInfo.canBePermanent) {
                    typeGroup.style.display = 'block';
                } else {
                    typeGroup.style.display = 'none';
                    document.getElementById('condition-type').value = 'temporary';
                }

                const durationInput = document.getElementById('condition-duration');
                if (conditionInfo.maxDuration) {
                    durationInput.max = conditionInfo.maxDuration;
                    durationInput.value = Math.min(conditionInfo.defaultDuration || 1, conditionInfo.maxDuration);
                } else {
                    durationInput.max = 100;
                    durationInput.value = conditionInfo.defaultDuration || 1;
                }

                if (conditionInfo.type === 'special') {
                    durationGroup.style.display = 'none';
                } else {
                    durationGroup.style.display = 'block';
                }
            }
        });

        // Инициализируем при загрузке
        const initialCondition = conditionSelect.value;
        const initialInfo = CONDITIONS[initialCondition] || {};
        document.getElementById('exhaustion-level-group').style.display =
            initialCondition === 'exhaustion' ? 'block' : 'none';

        document.getElementById('condition-type-group').style.display =
            initialInfo.canBePermanent ? 'block' : 'none';
    }
}

function initColorPickers() {
    const creatureColorPicker = document.querySelector('#creature-form .color-picker');
    if (creatureColorPicker) {
        creatureColorPicker.addEventListener('click', function (e) {
            const colorOption = e.target.closest('.color-option');
            if (!colorOption) return;

            const color = colorOption.dataset.color;
            document.getElementById('cr-color').value = color;

            document.querySelectorAll('#creature-form .color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            colorOption.classList.add('selected');
        });
    }

    const quickNpcColorPicker = document.querySelector('#quick-npc-modal .color-picker');
    if (quickNpcColorPicker) {
        quickNpcColorPicker.addEventListener('click', function (e) {
            const colorOption = e.target.closest('.color-option');
            if (!colorOption) return;

            const color = colorOption.dataset.color;
            document.getElementById('quick-npc-color').value = color;

            document.querySelectorAll('#quick-npc-modal .color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            colorOption.classList.add('selected');
        });
    }

    const editColorPicker = document.getElementById('color-picker');
    if (editColorPicker) {
        editColorPicker.addEventListener('click', function (e) {
            const colorOption = e.target.closest('.color-option');
            if (!colorOption) return;

            const color = colorOption.dataset.color;
            document.getElementById('edit-color').value = color;

            document.querySelectorAll('#color-picker .color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            colorOption.classList.add('selected');
        });
    }
}

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
function saveCreature() {
    const name = document.getElementById('cr-name').value.trim();
    if (!name) {
        alert('Введите имя существа');
        return;
    }

    // Получаем выбранные значения из чекбоксов
    const resistances = getCheckedValues('#cr-resistances-container', 'damage-checkbox');
    const immunities = getCheckedValues('#cr-immunities-container', 'immunity-checkbox');
    const vulnerabilities = getCheckedValues('#cr-vulnerabilities-container', 'vulnerability-checkbox');

    const creatureData = {
        name: name,
        maxHP: parseInt(document.getElementById('cr-max-hp').value) || 10,
        ac: parseInt(document.getElementById('cr-ac').value) || 10,
        initBonus: parseInt(document.getElementById('cr-init-bonus').value) || 0,
        attackBonus: parseInt(document.getElementById('cr-attack-bonus').value) || 0,
        damage: document.getElementById('cr-damage').value.trim() || '1d6',
        damageType: document.getElementById('cr-damage-type').value,
        resistances: resistances,
        immunities: immunities,
        vulnerabilities: vulnerabilities,
        multiattack: document.getElementById('cr-multiattack').value.trim(),
        legendaryActions: parseActions(document.getElementById('cr-legendary-actions').value),
        lairActions: parseActions(document.getElementById('cr-lair-actions').value),
        color: document.getElementById('cr-color').value || '#3498db'
    };

    if (state.editingCreatureId) {
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

function editCreature(creatureId) {
    const creature = state.creatures.find(c => c.id === creatureId);
    if (!creature) return;

    document.getElementById('cr-id').value = creature.id;
    document.getElementById('cr-name').value = creature.name;
    document.getElementById('cr-max-hp').value = creature.maxHP;
    document.getElementById('cr-ac').value = creature.ac;
    document.getElementById('cr-init-bonus').value = creature.initBonus || 0;
    document.getElementById('cr-attack-bonus').value = creature.attackBonus;
    document.getElementById('cr-damage').value = creature.damage;
    document.getElementById('cr-damage-type').value = creature.damageType;
    setCheckedValues('#cr-resistances-container', 'damage-checkbox', creature.resistances);
    setCheckedValues('#cr-immunities-container', 'immunity-checkbox', creature.immunities);
    setCheckedValues('#cr-vulnerabilities-container', 'vulnerability-checkbox', creature.vulnerabilities);
    document.getElementById('cr-multiattack').value = creature.multiattack || '';
    document.getElementById('cr-legendary-actions').value = creature.legendaryActions ? creature.legendaryActions.join('|') : '';
    document.getElementById('cr-lair-actions').value = creature.lairActions ? creature.lairActions.join('|') : '';
    document.getElementById('cr-color').value = creature.color || '#3498db';

    document.querySelectorAll('#creature-form .color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === creature.color) {
            opt.classList.add('selected');
        }
    });

    state.editingCreatureId = creatureId;
    document.getElementById('form-title').textContent = 'Редактировать существо';
    document.getElementById('save-button-text').textContent = 'Обновить существо';
    document.getElementById('edit-controls').style.display = 'block';

    document.querySelector('[data-tab="bestiary"]').click();
    document.getElementById('creature-form').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    state.editingCreatureId = null;
    resetCreatureForm();
}

function resetCreatureForm() {
    document.getElementById('cr-id').value = '';
    document.getElementById('cr-name').value = '';
    document.getElementById('cr-max-hp').value = '100';
    document.getElementById('cr-ac').value = '18';
    document.getElementById('cr-init-bonus').value = '0';
    document.getElementById('cr-attack-bonus').value = '10';
    document.getElementById('cr-damage').value = '2d6+3';
    document.getElementById('cr-damage-type').value = 'slashing';
    resetCheckboxes('#cr-resistances-container', 'damage-checkbox');
    resetCheckboxes('#cr-immunities-container', 'immunity-checkbox');
    resetCheckboxes('#cr-vulnerabilities-container', 'vulnerability-checkbox');
    document.getElementById('cr-multiattack').value = '';
    document.getElementById('cr-legendary-actions').value = '';
    document.getElementById('cr-lair-actions').value = '';
    document.getElementById('cr-color').value = '#3498db';

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

function parseActions(input) {
    return input.split('|')
        .map(a => a.trim())
        .filter(a => a.length > 0);
}

// Вспомогательные функции для работы с чекбоксами
function getCheckedValues(containerSelector, checkboxClass) {
    const container = document.querySelector(containerSelector);
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll(`input[type="checkbox"].${checkboxClass}`);
    const values = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            values.push(checkbox.value);
        }
    });
    
    return values;
}

function setCheckedValues(containerSelector, checkboxClass, values) {
    const container = document.querySelector(containerSelector);
    if (!container || !values) return;
    
    const checkboxes = container.querySelectorAll(`input[type="checkbox"].${checkboxClass}`);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = values.includes(checkbox.value);
    });
}

function resetCheckboxes(containerSelector, checkboxClass) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const checkboxes = container.querySelectorAll(`input[type="checkbox"].${checkboxClass}`);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

// Функции для быстрого выбора всех/снятия всех чекбоксов
function selectAllCheckboxes(containerSelector, checkboxClass) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const checkboxes = container.querySelectorAll(`input[type="checkbox"].${checkboxClass}`);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

function deselectAllCheckboxes(containerSelector, checkboxClass) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const checkboxes = container.querySelectorAll(`input[type="checkbox"].${checkboxClass}`);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

function renderSavedCreatures() {
    const container = document.getElementById('saved-creatures');
    const searchTerm = document.getElementById('creature-search')?.value.toLowerCase() || '';

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
        <div class="stat-block" style="min-width: 400px; max-width: 500px; cursor: pointer;"
            ondblclick="viewCreatureDetails(${creature.id})">
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

    const colors = [];
    if (autoColors) {
        for (let i = 0; i < count; i++) {
            colors.push(defaultColors[i % defaultColors.length]);
        }
    } else {
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

        let numberSuffix = '';
        switch (numberingType) {
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

function showAddToBattleModal() {
    const container = document.getElementById('battle-creatures-list');
    container.innerHTML = '';

    if (state.creatures.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет сохранённых существ</div>';
        showModal('add-to-battle-modal');
        return;
    }

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

    const colors = [];
    if (autoColors) {
        for (let i = 0; i < numCount; i++) {
            colors.push(defaultColors[i % defaultColors.length]);
        }
    } else {
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

        let numberSuffix = '';
        switch (numberingType) {
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

function createCreatureInstance(template, id) {
    const instance = {
        ...JSON.parse(JSON.stringify(template)),
        id: id,
        currentHP: template.maxHP,
        tempHP: 0,
        initiative: rollInitiative(template.initBonus || 0),
        conditions: [],
        concentration: false,
        usedLegendaryActions: 0,
        originalMaxHP: template.maxHP,
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
        originalDamageType: template.damageType,
        tempACModifiers: [],
        conditionEffects: {}
    };

    // Убедимся, что есть все необходимые поля
    if (!instance.resistances) instance.resistances = [];
    if (!instance.immunities) instance.immunities = [];
    if (!instance.vulnerabilities) instance.vulnerabilities = [];
    if (!instance.legendaryActions) instance.legendaryActions = [];
    if (!instance.lairActions) instance.lairActions = [];

    return instance;
}

function calculateCurrentAC(creature) {
    if (!creature || !creature.tempACModifiers || creature.tempACModifiers.length === 0) {
        return creature.ac;
    }

    const activeModifiers = creature.tempACModifiers.filter(mod => {
        if (mod.type === 'turns') {
            return mod.duration > 0;
        }
        return mod.type === 'until_removed';
    });

    if (activeModifiers.length === 0) {
        return creature.ac;
    }

    let totalBonus = 0;
    activeModifiers.forEach(mod => {
        totalBonus += mod.value;
    });

    return Math.max(0, creature.ac + totalBonus);
}

function decrementTempACDurations() {
    state.battle.participants.forEach(creature => {
        if (creature.tempACModifiers && creature.tempACModifiers.length > 0) {
            creature.tempACModifiers.forEach(mod => {
                if (mod.type === 'turns' && mod.duration > 0) {
                    mod.duration--;
                }
            });

            creature.tempACModifiers = creature.tempACModifiers.filter(mod => {
                if (mod.type === 'turns') {
                    return mod.duration > 0;
                }
                return mod.type === 'until_removed';
            });
        }
    });
}

function rollInitiative(bonus = 0) {
    return Math.floor(Math.random() * 20) + 1 + bonus;
}

function rollAllInitiative() {
    const groups = {};
    const groupInitiatives = {};

    state.battle.participants.forEach(creature => {
        if (creature.groupId) {
            if (!groups[creature.groupId]) {
                groups[creature.groupId] = [];
                groupInitiatives[creature.groupId] = rollInitiative(creature.initBonus || 0);
            }
            groups[creature.groupId].push(creature);
        }
    });

    Object.keys(groups).forEach(groupId => {
        const groupInitiative = groupInitiatives[groupId];
        groups[groupId].forEach(member => {
            member.initiative = groupInitiative;
        });
    });

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

function sortInitiative() {
    if (state.battle.participants.length === 0) return;

    const toSort = [...state.battle.participants];

    toSort.sort((a, b) => {
        if (b.initiative === a.initiative) {
            return a.name.localeCompare(b.name);
        }
        return b.initiative - a.initiative;
    });

    state.battle.participants = toSort;
    saveToLocalStorage();
}

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

    const current = state.battle.participants[state.battle.currentTurn];
    document.getElementById('current-turn-name').textContent = current ? current.name : '-';

    const groups = {};
    const standalone = [];

    state.battle.participants.forEach(c => c._processed = false);

    for (let i = 0; i < state.battle.participants.length; i++) {
        const creature = state.battle.participants[i];

        if (creature._processed) continue;

        if (creature.groupId) {
            const groupMembers = state.battle.participants.filter(p => p.groupId === creature.groupId);

            groupMembers.forEach(member => member._processed = true);

            groups[creature.groupId] = {
                id: creature.groupId,
                name: creature.baseName || creature.name,
                members: groupMembers,
                initiative: groupMembers[0].initiative,
                isExpanded: state.battle.groups[creature.groupId] || false
            };
        } else {
            creature._processed = true;
            standalone.push({ ...creature, index: i });
        }
    }

    const sortedGroups = Object.values(groups).sort((a, b) => b.initiative - a.initiative);
    standalone.sort((a, b) => b.initiative - a.initiative);

    const displayItems = [];
    let groupIdx = 0, standaloneIdx = 0;

    while (groupIdx < sortedGroups.length || standaloneIdx < standalone.length) {
        if (groupIdx < sortedGroups.length && standaloneIdx < standalone.length) {
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

    if (state.currentCreature !== null) {
        renderCreatureDetails();
    }

    updateBattleStats();
    updateRoundDisplay();
}

function createInitiativeItem(creature, isActive) {
    const div = document.createElement('div');
    div.className = `initiative-item ${isActive ? 'active' : ''}`;
    div.setAttribute('data-index', creature.index);
    div.setAttribute('draggable', 'true');

    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);
    div.addEventListener('dragend', handleDragEnd);

    const hpPercentage = Math.max(0, (creature.currentHP / creature.maxHP) * 100);
    const currentAC = calculateCurrentAC(creature);
    const baseAC = creature.ac;
    const hasTempACModifiers = creature.tempACModifiers && creature.tempACModifiers.length > 0;

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
                ${creature.dead ? ' 💀' : (creature.stabilized ? ' 💖' : (creature.currentHP <= 0 ? ' 👻' : ''))}
                </div>
            <div class="hp-bar-container">
                <div class="hp-bar" style="width: ${hpPercentage}%"></div>
            </div>
            <div class="creature-stats">
                <span>❤️ ${creature.currentHP}/${creature.maxHP}</span>
                <span class="ac-display" title="${hasTempACModifiers ? `Базовое КД: ${baseAC}` : ''}">
                    🛡️ ${currentAC}
                    ${hasTempACModifiers ?
            `<span style="font-size: 0.8em; color: #f39c12; margin-left: 2px;">
                            (${baseAC})
                        </span>` : ''
        }
                </span>
                ${hasTempACModifiers ?
            `<span class="temp-ac-indicator" title="${creature.tempACModifiers.map(m =>
                `${m.description || ''} ${m.value >= 0 ? '+' : ''}${m.value}${m.type === 'turns' ? ` (${m.duration} ходов)` : ''}`).join(', ')}"
                        style="background: #f39c12; color: white; padding: 1px 6px; border-radius: 10px; font-size: 0.8em;">
                        ⬆️${creature.tempACModifiers.reduce((sum, m) => sum + m.value, 0) >= 0 ? '+' : ''}
                        ${creature.tempACModifiers.reduce((sum, m) => sum + m.value, 0)}
                    </span>` : ''
        }
                ${creature.tempHP > 0 ?
            `<span class="temp-hp-display">❤️✨ ${creature.tempHP}</span>` : ''}
            </div>
            <div class="conditions">            
            ${creature.conditions.map(c => {
                if (c.name === 'concentration') {
                    return `<span style="background: rgba(155, 89, 182, 0.2); padding: 2px 6px; border-radius: 10px; font-weight: bold; color: #9b59b6;">
                            ✨ Концентрация
                        </span>`
                }
                if (c.name === 'exhaustion') {
                    return `<span class="condition-badge ${c.name}" title="${getConditionName(c.name)} (уровень ${c.level})">${getConditionName(c.name).substring(0, 3)} ${c.level}</span>`;
                }
                return `<span class="condition-badge ${c.name}" title="${getConditionName(c.name)}${c.duration !== null && !c.isPermanent ? ` (${c.duration} ходов)` : ''}">${getConditionName(c.name).substring(0, 3)} ${c.duration !== null ? c.duration : '∞'}</span>`;
            }).join('')}
                ${creature.usedLegendaryActions > 0 ?
            `<span class="condition-badge" style="background: #f39c12; color: white;" title="Использовано легендарных действий: ${creature.usedLegendaryActions}">
                        ⚡ ${creature.usedLegendaryActions}
                    </span>` : ''
        }
                ${creature.usedLairActions ?
            `<span class="condition-badge" style="background: #7f8c8d; color: white;" title="Действие логова использовано">
                        🏔️
                    </span>` : ''
        }
            </div>
            ${creature.currentHP <= 0 ? `
                <button onclick="showDeathSavesModal(${creature.index})" class="btn btn-sm" style="background: #e74c3c; color: white; margin-top: 5px;">
                    <i class="fas fa-heartbeat"></i> Спасброски
                </button>
            ` : ''}
        </div>
        ${creature.currentHP <= 0 && !creature.dead ? `
            <div class="death-saves-mini">
                <span class="death-save-mini success">${creature.deathSaves.successes}/3</span>
                <span class="death-save-mini failure">${creature.deathSaves.failures}/3</span>
            </div>
        ` : ''}

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

function createGroupElement(group, isActive) {
    const groupElement = document.createElement('div');
    groupElement.className = `initiative-item ${isActive ? 'active' : ''}`;
    groupElement.setAttribute('data-group-id', group.id);
    groupElement.setAttribute('draggable', 'true');

    groupElement.addEventListener('dragstart', handleDragStart);
    groupElement.addEventListener('dragover', handleDragOver);
    groupElement.addEventListener('drop', handleDrop);
    groupElement.addEventListener('dragend', handleDragEnd);

    const aliveCount = group.members.filter(m => m.currentHP > 0).length;

    const groupACs = group.members.map(m => calculateCurrentAC(m));
    const minAC = Math.min(...groupACs);
    const maxAC = Math.max(...groupACs);
    const hasTempACModifiers = group.members.some(m => m.tempACModifiers && m.tempACModifiers.length > 0);

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
                <span class="ac-display" title="${hasTempACModifiers ? `КД в группе: от ${minAC} до ${maxAC}` : `КД: ${group.members[0]?.ac || 10}`}">
                    🛡️ ${minAC === maxAC ? minAC : `${minAC}-${maxAC}`}
                    ${hasTempACModifiers ?
            `<span style="font-size: 0.8em; color: #f39c12; margin-left: 2px;">
                            (${minAC === maxAC ? 'разные' : 'разные'})
                        </span>` : ''
        }
                </span>
                ${hasTempACModifiers ?
            `<span class="temp-ac-indicator" title="В группе есть временные модификаторы КД"
                        style="background: #f39c12; color: white; padding: 1px 6px; border-radius: 10px; font-size: 0.8em;">
                        ⬆️
                    </span>` : ''
        }
            </div>
        </div>
        <div>
            <div style="display: flex; gap: 5px;">
                <button onclick="editGroupInitiative('${group.id}')" class="btn btn-sm btn-warning">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="removeGroup('${group.id}')" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;

    if (group.isExpanded) {
        const membersContainer = document.createElement('div');
        membersContainer.className = 'group-members';

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

                const hpPercentage = Math.max(0, (member.currentHP / member.maxHP) * 100);
                const currentAC = calculateCurrentAC(member);
                const hasTempModifiers = member.tempACModifiers && member.tempACModifiers.length > 0;

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
                        <div class="hp-display" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <span>❤️ ${member.currentHP}/${member.maxHP}</span>
                            <span class="ac-display" title="${hasTempModifiers ? `Базовое КД: ${member.ac}` : ''}">
                                🛡️ ${currentAC}
                                ${hasTempModifiers ?
                        `<span style="font-size: 0.8em; color: #f39c12; margin-left: 2px;">
                                        (${member.ac})
                                    </span>` : ''
                    }
                            </span>
                            ${member.tempHP > 0 ?
                        `<span class="temp-hp-display" style="background: rgba(243, 156, 18, 0.2); padding: 2px 6px; border-radius: 10px; font-weight: bold;">
                            ❤️✨ ${member.tempHP}
                                </span>` : ''
                    }
                            ${hasTempModifiers ?
                        `<span class="temp-ac-indicator" title="${member.tempACModifiers.map(m =>
                            `${m.description || ''} ${m.value >= 0 ? '+' : ''}${m.value}${m.type === 'turns' ? ` (${m.duration} ходов)` : ''}`).join(', ')}"
                            style="background: #f39c12; color: white; padding: 1px 6px; border-radius: 10px; font-size: 0.8em;">
                            ⬆️${member.tempACModifiers.reduce((sum, m) => sum + m.value, 0) >= 0 ? '+' : ''}
                            ${member.tempACModifiers.reduce((sum, m) => sum + m.value, 0)}
                        </span>` : ''
                    }
                            ${member.conditions.some(c => c.name === 'concentration') ?
                        `<span style="background: rgba(155, 89, 182, 0.2); padding: 2px 6px; border-radius: 10px; font-weight: bold; color: #9b59b6;">
                                ✨ Концентрация
                            </span>` : ''
                    }
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

function updateGroupMemberDisplay(memberIndex) {
    const creature = state.battle.participants[memberIndex];
    if (!creature.groupId) return;

    const groupElement = document.querySelector(`[data-group-id="${creature.groupId}"]`);
    if (!groupElement || !groupElement.classList.contains('expanded')) return;

    const memberElement = groupElement.querySelector(`.group-member[data-index="${memberIndex}"]`);
    if (!memberElement) return;

    const hpPercentage = Math.max(0, (creature.currentHP / creature.maxHP) * 100);
    const currentAC = calculateCurrentAC(creature);
    const hasTempModifiers = creature.tempACModifiers && creature.tempACModifiers.length > 0;

    memberElement.querySelector('.hp-bar').style.width = `${hpPercentage}%`;

    const hpDisplay = memberElement.querySelector('.hp-display');
    if (hpDisplay) {
        hpDisplay.innerHTML = `
            <span>❤️ ${creature.currentHP}/${creature.maxHP}</span>
            <span class="ac-display" title="${hasTempModifiers ? `Базовое КД: ${creature.ac}` : ''}">
                🛡️ ${currentAC}
                ${hasTempModifiers ?
                `<span style="font-size: 0.8em; color: #f39c12; margin-left: 2px;">
                        (${creature.ac})
                    </span>` : ''
            }
            </span>
            ${creature.tempHP > 0 ?
                `<span class="temp-hp-display" style="background: rgba(243, 156, 18, 0.2); padding: 2px 6px; border-radius: 10px; font-weight: bold;">
                    ❤️✨ ${creature.tempHP}
                </span>` : ''
            }
            ${hasTempModifiers ?
                `<span class="temp-ac-indicator" title="${creature.tempACModifiers.map(m =>
                    `${m.description || ''} ${m.value >= 0 ? '+' : ''}${m.value}${m.type === 'turns' ? ` (${m.duration} ходов)` : ''}`).join(', ')}"
                    style="background: #f39c12; color: white; padding: 1px 6px; border-radius: 10px; font-size: 0.8em;">
                    ⬆️${creature.tempACModifiers.reduce((sum, m) => sum + m.value, 0) >= 0 ? '+' : ''}
                    ${creature.tempACModifiers.reduce((sum, m) => sum + m.value, 0)}
                </span>` : ''
            }
            ${creature.conditions.some(c => c.name === 'concentration') ?
                `<span style="background: rgba(155, 89, 182, 0.2); padding: 2px 6px; border-radius: 10px; font-weight: bold; color: #9b59b6;">
                    ✨ Концентрация
                </span>` : ''
            }
        `;
    }
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

    setTimeout(() => {
        item.classList.add('dragging');
    }, 0);

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

    document.getElementById('ungroup-drop-zone').classList.remove('active');
    document.querySelectorAll('.group-drop-zone.active').forEach(z => z.classList.remove('active'));

    try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));

        if (data.type === 'creature') {
            const targetItem = e.target.closest('.initiative-item');
            if (targetItem) {
                const targetGroupId = targetItem.getAttribute('data-group-id');
                if (targetGroupId) {
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
    if (state.dragItem) {
        state.dragItem.classList.remove('dragging');
    }

    document.getElementById('ungroup-drop-zone').classList.remove('active');
    document.querySelectorAll('.group-drop-zone.active').forEach(z => z.classList.remove('active'));

    state.dragItem = null;
    state.dragType = null;
    state.dragData = null;
}

function addCreatureToGroup(creatureIndex, targetGroupId) {
    const creature = state.battle.participants[creatureIndex];
    if (!creature || creature.groupId === targetGroupId) return;

    const oldGroupId = creature.groupId;
    const targetGroup = state.battle.participants.find(c => c.groupId === targetGroupId);
    const newGroupName = targetGroup ? targetGroup.baseName : 'Группа';

    const groupMembers = state.battle.participants.filter(c => c.groupId === targetGroupId);
    const maxGroupNumber = groupMembers.reduce((max, c) => Math.max(max, c.groupNumber || 0), 0);

    creature.groupId = targetGroupId;
    creature.groupNumber = maxGroupNumber + 1;
    creature.groupName = `Группа "${newGroupName}"`;
    creature.baseName = newGroupName;

    addToLog(`${creature.name} перемещен в группу "${newGroupName}"`);

    if (oldGroupId) {
        const oldGroupCount = state.battle.participants.filter(c => c.groupId === oldGroupId).length;
        if (oldGroupCount === 0) {
            delete state.battle.groups[oldGroupId];
            addToLog(`Группа удалена (пустая)`);
        }
    }

    renderBattle();
    saveToLocalStorage();
}

function ungroupCreature(index) {
    const creature = state.battle.participants[index];
    if (!creature || !creature.groupId) return;

    const oldGroupId = creature.groupId;

    creature.groupId = null;
    creature.groupName = null;
    creature.groupNumber = 0;
    creature.baseName = creature.name;

    addToLog(`${creature.name} выведен из группы`);

    const oldGroupCount = state.battle.participants.filter(c => c.groupId === oldGroupId).length;
    if (oldGroupCount === 0) {
        delete state.battle.groups[oldGroupId];
        addToLog(`Группа удалена (пустая)`);
    }

    renderBattle();
    saveToLocalStorage();
}

function toggleGroup(groupId) {
    state.battle.groups[groupId] = !state.battle.groups[groupId];
    renderBattle();
}

function removeFromBattle(index) {
    if (confirm('Удалить это существо из боя?')) {
        const creature = state.battle.participants[index];
        const groupId = creature.groupId;

        state.battle.participants.splice(index, 1);

        addToLog(`${creature.name} удалён из боя`);

        if (groupId) {
            const groupCount = state.battle.participants.filter(c => c.groupId === groupId).length;
            if (groupCount === 0) {
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

function removeGroup(groupId) {
    if (!confirm('Удалить всю группу целиком?')) {
        return;
    }

    const groupMembers = state.battle.participants.filter(p => p.groupId === groupId);
    if (groupMembers.length === 0) return;

    const groupName = groupMembers[0].baseName || groupMembers[0].name.replace(/\s+\d+$/, '');

    const indicesToRemove = [];
    groupMembers.forEach(member => {
        const index = state.battle.participants.findIndex(p => p.id === member.id);
        if (index !== -1) {
            indicesToRemove.push(index);
        }
    });

    indicesToRemove.sort((a, b) => b - a);

    let removedCount = 0;
    indicesToRemove.forEach(index => {
        if (state.currentCreature === index) {
            state.currentCreature = null;
        } else if (state.currentCreature > index) {
            state.currentCreature--;
        }

        state.battle.participants.splice(index, 1);
        removedCount++;
    });

    delete state.battle.groups[groupId];

    if (state.battle.currentTurn >= state.battle.participants.length) {
        state.battle.currentTurn = Math.max(0, state.battle.participants.length - 1);
    }

    addToLog(`Группа "${groupName}" (${removedCount} существ) удалена из боя`);

    renderBattle();
    updateContextCreatures();
    saveToLocalStorage();
}

function editCreatureInitiative(index) {
    const creature = state.battle.participants[index];
    if (!creature) return;

    state.editInitiativeIndex = index;
    document.getElementById('edit-initiative').value = creature.initiative;
    showModal('initiative-modal');
}

function editGroupInitiative(groupId) {
    const groupMembers = state.battle.participants.filter(p => p.groupId === groupId);
    if (groupMembers.length === 0) return;

    state.editInitiativeIndex = groupId;
    document.getElementById('edit-initiative').value = groupMembers[0].initiative;
    showModal('initiative-modal');
}

function saveInitiative() {
    if (state.editInitiativeIndex === null) return;

    const newInitiative = parseInt(document.getElementById('edit-initiative').value);
    if (!isNaN(newInitiative)) {
        if (typeof state.editInitiativeIndex === 'string') {
            const groupId = state.editInitiativeIndex;
            state.battle.participants.forEach(c => {
                if (c.groupId === groupId) {
                    c.initiative = newInitiative;
                }
            });
            addToLog(`Инициатива группы изменена на ${newInitiative}`);
        } else {
            const creature = state.battle.participants[state.editInitiativeIndex];
            creature.initiative = newInitiative;

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
function selectCreature(index) {
    state.currentCreature = index;
    renderCreatureDetails();
}

function renderCreatureDetails() {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) {
        document.getElementById('creature-details').innerHTML = '<div class="empty-state">Существо не найдено</div>';
        return;
    }

    // Словари для перевода на русский
    const damageTypeTranslation = {
        'slashing': 'Рубящий',
        'piercing': 'Колющий', 
        'bludgeoning': 'Дробящий',
        'fire': 'Огонь',
        'cold': 'Холод',
        'acid': 'Кислота',
        'lightning': 'Электричество',
        'poison': 'Яд',
        'radiant': 'Свет',
        'necrotic': 'Некротический',
        'psychic': 'Психический',
        'force': 'Силовой',
        'thunder': 'Звук'
    };

    const conditionTranslation = {
        'blinded': 'Ослепление',
        'charmed': 'Очарование',
        'frightened': 'Испуг',
        'grappled': 'Схваченность',
        'paralyzed': 'Паралич',
        'petrified': 'Окаменение',
        'poisoned': 'Отравление',
        'prone': 'Сбит с ног',
        'restrained': 'Ограничение',
        'stunned': 'Оглушение',
        'unconscious': 'Бессознательность',
        'invisible': 'Невидимость',
        'deafened': 'Глухота',
        'exhaustion': 'Истощение',
        'incapacitated': 'Недееспособность'
    };

    // Функции для перевода
    const translateDamageType = (type) => damageTypeTranslation[type] || type;
    const translateCondition = (condition) => conditionTranslation[condition] || condition;

    // Разделяем иммунитеты на типы урона и состояния
    const damageImmunities = creature.immunities.filter(immunity => damageTypeTranslation[immunity]);
    const conditionImmunities = creature.immunities.filter(immunity => conditionTranslation[immunity]);

    let html = `
        <div class="stat-block">
            <div class="creature-header">
                <h4>
                    <span class="creature-color" style="background: ${creature.color}; width: 20px; height: 20px;"></span>
                    ${creature.name}
                    ${creature.groupNumber ? `<span class="group-number" style="margin-left: 10px;">${creature.groupNumber}</span>` : ''}
                </h4>
                ${creature.groupId ? `<small>(Группа: ${creature.baseName})</small>` : ''}
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
                    ${creature.tempACModifiers && creature.tempACModifiers.length > 0 ? `
                        <div style="margin-top: 5px; font-size: 0.85rem;">
                            ${creature.tempACModifiers.map((mod, idx) => `
                                <div class="temp-ac-badge" style="
                                    display: inline-block;
                                    background: ${mod.value >= 0 ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'};
                                    color: ${mod.value >= 0 ? '#27ae60' : '#c0392b'};
                                    padding: 2px 8px;
                                    border-radius: 10px;
                                    margin: 2px;
                                    border: 1px solid ${mod.value >= 0 ? '#2ecc71' : '#e74c3c'};
                                    font-size: 0.8rem;
                                ">
                                    ${mod.value >= 0 ? '+' : ''}${mod.value} 
                                    ${mod.type === 'turns' ? `(${mod.duration} хв)` : '⏱️'}
                                    <button onclick="removeTempACModifier(${state.currentCreature}, ${idx})" 
                                            style="background: none; border: none; color: #666; margin-left: 5px; cursor: pointer; font-size: 0.7rem;">
                                        ✕
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="stat-item">
                    <label>Инициатива</label>
                    <span>${creature.initiative}</span>
                </div>
            </div>
            
            <div class="hp-control">
                <button onclick="showDamageModal()" class="btn btn-danger">Урон</button>
                <button onclick="showHealingModal()" class="btn btn-success">Лечение</button>
                <button onclick="showTempHPModal()" class="btn btn-warning">
                    <i class="fas fa-shield-alt"></i> Временные HP
                </button>
                <button onclick="showTempACModal()" class="btn btn-warning">
                    <i class="fas fa-shield-alt"></i> Временные КД
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
            
            <div class="action-buttons" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 15px;">
                <button onclick="rollAttack()" class="btn btn-warning" 
                        style="padding: 2px 5px; height: 40px; font-size: 0.85rem; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-crosshairs"></i> Атака
                </button>
                <button onclick="rollDamage()" class="btn btn-danger" 
                        style="padding: 2px 5px; height: 40px; font-size: 0.85rem; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-bolt"></i> Урон
                </button>
                <button onclick="showConditionModal()" class="btn btn-primary" 
                        style="padding: 2px 5px; height: 40px; font-size: 0.85rem; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-exclamation-triangle"></i> Состояния
                </button>
                <button onclick="toggleConcentration()" class="btn btn-info" 
                        style="padding: 2px 5px; height: 40px; font-size: 0.85rem; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-brain"></i> ${creature.conditions.some(c => c.name === 'concentration') ? 'Сброс' : 'Концентрация'}
                </button>
                <button onclick="showEditCreatureModal(state.currentCreature)" class="btn btn-primary" 
                        style="padding: 2px 5px; height: 40px; font-size: 0.85rem; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-edit"></i> Ред.
                </button>
                <button onclick="saveCreatureFromBattle(state.currentCreature)" class="btn btn-success" 
                        style="padding: 2px 5px; height: 40px; font-size: 0.85rem; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-book-medical"></i> Сохранить
                </button>
            </div>
    `;

    html += `
        <div class="section">
            <h5><i class="fas fa-heartbeat"></i> Спасброски от смерти</h5>
            ${renderDeathSaves(creature, state.currentCreature)}
        </div>
    `;

    if (creature.conditions.length > 0) {
        html += `
            <div class="section">
                <h5><i class="fas fa-exclamation-triangle"></i> Активные состояния</h5>
                <div class="conditions-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 8px;
                    margin-top: 10px;
                ">
                    ${creature.conditions.map(cond => {
            const info = getConditionInfo(cond.name);
            const isExhaustion = cond.name === 'exhaustion';
            const durationText = cond.isPermanent ? '∞' :
                (cond.duration === null ? 'до снятия' : `${cond.duration} ходов`);

            return `
                            <div class="condition-item" style="
                                border-left: 4px solid ${getConditionColor(cond.name)};
                                padding: 10px;
                                background: white;
                                border-radius: 4px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                                display: flex;
                                flex-direction: column;
                            ">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div style="flex: 1;">
                                        <strong style="font-size: 0.9rem;">
                                            ${info.name}
                                            ${isExhaustion ? `<span style="
                                                background: #8e44ad;
                                                color: white;
                                                padding: 1px 6px;
                                                border-radius: 10px;
                                                font-size: 0.8rem;
                                                margin-left: 5px;
                                            ">${cond.level}</span>` : ''}
                                        </strong>
                                        <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">
                                            ${isExhaustion ? `Уровень ${cond.level}` : durationText}
                                        </div>
                                    </div>
                                    <button onclick="removeCondition('${cond.id}')" 
                                            class="btn btn-xs btn-danger" 
                                            style="padding: 2px 6px; font-size: 0.7rem;">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                
                                ${isExhaustion ? `
                                    <div style="display: flex; align-items: center; gap: 5px; margin-top: 10px;">
                                        <button onclick="changeExhaustionLevel('${cond.id}', -1)" 
                                                class="btn btn-xs" 
                                                style="padding: 2px 8px; font-size: 0.7rem; background: #e74c3c; color: white;">
                                            -1
                                        </button>
                                        <span style="flex: 1; text-align: center; font-weight: bold; font-size: 0.9rem;">
                                            Уровень ${cond.level || 1}
                                        </span>
                                        <button onclick="changeExhaustionLevel('${cond.id}', 1)" 
                                                class="btn btn-xs" 
                                                style="padding: 2px 8px; font-size: 0.7rem; background: #2ecc71; color: white;">
                                            +1
                                        </button>
                                    </div>
                                    <div style="font-size: 0.75rem; color: #8e44ad;">
                                        <strong>Эффекты (уровень ${cond.level}):</strong>
                                        ${Array.from({ length: cond.level }, (_, i) =>
                `<div style="margin-top: 2px;">• ${CONDITIONS.exhaustion.levelEffects[i + 1]}</div>`
            ).join('')}
                                    </div>
                                ` : cond.duration !== null && !cond.isPermanent ? `
                                    <div style="display: flex; align-items: center; gap: 5px; margin-top: 10px;">
                                        <button onclick="changeConditionDuration('${cond.id}', -1)" 
                                                class="btn btn-xs" 
                                                style="padding: 2px 8px; font-size: 0.7rem; background: #e74c3c; color: white;">
                                            -1
                                        </button>
                                        <span style="flex: 1; text-align: center; font-weight: bold; font-size: 0.9rem;">
                                            ${cond.duration} хв
                                        </span>
                                        <button onclick="changeConditionDuration('${cond.id}', 1)" 
                                                class="btn btn-xs" 
                                                style="padding: 2px 8px; font-size: 0.7rem; background: #2ecc71; color: white;">
                                            +1
                                        </button>
                                    </div>
                                ` : ''}
                                
                                ${info.effects && info.effects.length > 0 && !isExhaustion ? `
                                    <div style="margin-top: 8px;">
                                        <div style="font-size: 0.75rem; color: #666;">
                                            ${info.effects.map(effect =>
                `<div style="margin-bottom: 2px;">• ${effect}</div>`
            ).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    if (creature.legendaryActions && creature.legendaryActions.length > 0) {
        const maxLegendaryActions = 3;
        const remainingActions = maxLegendaryActions - creature.usedLegendaryActions;

        html += `
            <div class="legendary-actions-container">
                <h5><i class="fas fa-crown"></i> Легендарные действия</h5>
                <div class="legendary-actions-counter">
                    <span><strong>Использовано в этом раунде:</strong> ${creature.usedLegendaryActions}/${maxLegendaryActions}</span>
                    <div class="legendary-counter">
                        ${Array.from({ length: maxLegendaryActions }, (_, i) => `
                            <span class="legendary-dot ${i < creature.usedLegendaryActions ? 'used' : 'available'}"></span>
                        `).join('')}
                    </div>
                    <button onclick="resetLegendaryActionsForCreature(${state.currentCreature})" 
                            class="btn btn-sm btn-warning">
                        <i class="fas fa-redo"></i> Сбросить
                    </button>
                </div>
                
                <div style="margin-top: 10px;">
                    ${creature.legendaryActions.map((action, idx) => `
                        <button onclick="useLegendaryAction(${idx})" 
                                class="legendary-action-btn ${creature.usedLegendaryActions >= maxLegendaryActions ? 'legendary-action-used' : ''}"
                                ${creature.usedLegendaryActions >= maxLegendaryActions ? 'disabled' : ''}>
                            <span>${action}</span>
                            <span><i class="fas fa-bolt"></i></span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += `
        <div class="section">
            <h5><i class="fas fa-bolt"></i> Атака</h5>
            <div>
                <strong>Урон:</strong> ${creature.damage} 
                <span class="damage-type">${translateDamageType(creature.damageType)}</span>
            </div>
            ${creature.multiattack ? `
                <div style="margin-top: 10px;">
                    <strong>Мультиатака:</strong> ${creature.multiattack}
                </div>
            ` : ''}
        </div>
    `;

    // Обновленная секция защиты с четким разделением
    if (creature.resistances.length > 0 || creature.immunities.length > 0 || creature.vulnerabilities.length > 0) {
        html += `
            <div class="section">
                <h5><i class="fas fa-shield-alt"></i> Защита</h5>
                <div style="display: flex; flex-direction: column; gap: 10px;">
        `;

        // Сопротивления
        if (creature.resistances.length > 0) {
            html += `
                <div>
                    <strong style="color: var(--info); display: block; margin-bottom: 3px; font-size: 0.9em;">
                        Сопротивления:
                    </strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${creature.resistances.map(r =>
                `<span class="damage-mod resistance" title="${translateDamageType(r)}">${translateDamageType(r)}</span>`
            ).join('')}
                    </div>
                </div>
            `;
        }

        // Иммунитеты (типы урона)
        if (damageImmunities.length > 0) {
            html += `
                <div>
                    <strong style="color: var(--gray); display: block; margin-bottom: 3px; font-size: 0.9em;">
                        Иммунитеты (типы урона):
                    </strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${damageImmunities.map(i =>
                `<span class="damage-mod immunity" title="${translateDamageType(i)}">${translateDamageType(i)}</span>`
            ).join('')}
                    </div>
                </div>
            `;
        }

        // Иммунитеты (состояния)
        if (conditionImmunities.length > 0) {
            html += `
                <div>
                    <strong style="color: var(--gray); display: block; margin-bottom: 3px; font-size: 0.9em;">
                        Иммунитеты (состояния):
                    </strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${conditionImmunities.map(c =>
                `<span class="damage-mod immunity" title="${translateCondition(c)}">${translateCondition(c)}</span>`
            ).join('')}
                    </div>
                </div>
            `;
        }

        // Уязвимости
        if (creature.vulnerabilities.length > 0) {
            html += `
                <div>
                    <strong style="color: var(--danger); display: block; margin-bottom: 3px; font-size: 0.9em;">
                        Уязвимости:
                    </strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${creature.vulnerabilities.map(v =>
                `<span class="damage-mod vulnerability" title="${translateDamageType(v)}">${translateDamageType(v)}</span>`
            ).join('')}
                    </div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    }

    if (creature.lairActions && creature.lairActions.length > 0) {
        html += `
            <div class="section">
                <h5><i class="fas fa-mountain"></i> Действия логова</h5>
                <div class="lair-actions-list">
                    ${creature.lairActions.map((action, idx) => `
                        <div class="action-item">
                            ${action}
                            ${!creature.usedLairActions ?
                `<button onclick="useLairAction(${state.currentCreature}, ${idx})" 
                                        class="btn btn-sm btn-success" style="margin-top: 5px;">
                                    <i class="fas fa-play"></i> Использовать
                                </button>` :
                `<span class="btn btn-sm btn-secondary disabled" style="margin-top: 5px;">
                                    <i class="fas fa-check"></i> Использовано
                                </span>`
            }
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

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

    if (creature.groupId) {
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

// ============ ЛЕГЕНДАРНЫЕ ДЕЙСТВИЯ ============
function useLegendaryAction(actionIndex) {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature || !creature.legendaryActions || !creature.legendaryActions[actionIndex]) return;

    const maxLegendaryActions = 3;

    if (creature.usedLegendaryActions >= maxLegendaryActions) {
        addToLog(`${creature.name} уже использовал все легендарные действия в этом раунде`);
        return;
    }

    const action = creature.legendaryActions[actionIndex];
    creature.usedLegendaryActions++;

    addToLog(`⚡ ${creature.name} использует легендарное действие: ${action}`);

    renderCreatureDetails();
    saveToLocalStorage();

    if (creature.usedLegendaryActions >= maxLegendaryActions) {
        addToLog(`${creature.name} использовал все легендарные действия в этом раунде`);
    }
}

function resetLegendaryActions() {
    state.battle.participants.forEach(creature => {
        creature.usedLegendaryActions = 0;
        creature.usedLairActions = false;
    });
}

function newRound() {
    state.battle.round++;
    state.battle.currentTurn = 0;

    state.battle.participants.forEach(creature => {
        decrementConditionDurations(creature);
        creature.usedLegendaryActions = 0;
        creature.usedLairActions = false;

        if (creature.tempACModifiers) {
            creature.tempACModifiers.forEach(mod => {
                if (mod.type === 'turns' && mod.duration > 0) {
                    mod.duration--;
                }
            });

            creature.tempACModifiers = creature.tempACModifiers.filter(mod => {
                if (mod.type === 'turns') {
                    return mod.duration > 0;
                }
                return mod.type === 'until_removed';
            });
        }
    });

    resetLegendaryActions();
    updateRoundDisplay();
    saveToLocalStorage();
    addToLog(`=== Начало раунда ${state.battle.round} ===`);

    renderBattle();

    const currentCreature = state.battle.participants[state.battle.currentTurn];
    if (currentCreature) {
        addToLog(`Ход: ${currentCreature.name}`);
    }
}

function resetLegendaryActionsForCreature(index) {
    const creature = state.battle.participants[index];
    if (!creature) return;

    creature.usedLegendaryActions = 0;
    addToLog(`${creature.name}: легендарные действия сброшены`);
    renderBattle();
    renderCreatureDetails();
    saveToLocalStorage();
}

function useLairAction(index, actionIndex) {
    const creature = state.battle.participants[index];
    if (!creature || !creature.lairActions || !creature.lairActions[actionIndex]) return;

    if (creature.usedLairActions) {
        addToLog(`${creature.name} уже использовал действие логова в этом раунде`);
        return;
    }

    const action = creature.lairActions[actionIndex];
    creature.usedLairActions = true;

    addToLog(`🏔️ ${creature.name} использует действие логова: ${action}`);
    renderBattle();
    renderCreatureDetails();
    saveToLocalStorage();
}

// ============ ВРЕМЕННЫЕ ХИТЫ И КД ============
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

    let newTempHP = creature.tempHP;
    let message = '';

    switch (action) {
        case 'set':
            if (isNaN(amount) || amount < 0) {
                alert('Введите корректное количество');
                return;
            }
            newTempHP = amount;
            message = `Временные HP установлены на ${amount}`;
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
    if (creature.groupId) {
        updateGroupMemberDisplay(state.currentCreature);
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

function showTempACModal() {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) return;

    document.getElementById('temp-ac-value').value = '';
    document.getElementById('temp-ac-duration').value = '1';
    document.getElementById('temp-ac-type').value = 'turns';
    document.getElementById('temp-ac-description').value = '';

    const currentAC = calculateCurrentAC(creature);
    document.getElementById('current-ac-display').textContent =
        `Текущее КД: ${currentAC} (Базовое: ${creature.ac})`;

    const modifiersList = document.getElementById('active-temp-ac');
    const activeModifiers = creature.tempACModifiers ?
        creature.tempACModifiers.filter(mod => {
            if (mod.type === 'turns') return mod.duration > 0;
            return mod.type === 'until_removed';
        }) : [];

    if (activeModifiers.length > 0) {
        modifiersList.innerHTML = activeModifiers.map((mod, index) => {
            const originalIndex = creature.tempACModifiers.indexOf(mod);
            return `
                <div class="temp-ac-modifier">
                    <div>
                        <strong>${mod.value >= 0 ? '+' : ''}${mod.value} к КД</strong>
                        <div style="font-size: 0.9em; color: #666;">
                            ${mod.description || 'Без описания'}
                            ${mod.type === 'turns' ? ` (Осталось ходов: ${mod.duration})` : ' (До снятия)'}
                        </div>
                    </div>
                    <button onclick="removeTempACModifier(${state.currentCreature}, ${originalIndex})" 
                            class="btn btn-xs btn-danger">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
    } else {
        modifiersList.innerHTML = '<div style="text-align: center; color: #666; padding: 10px;">Нет активных временных КД</div>';
    }

    showModal('temp-ac-modal');
}

function applyTempAC() {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) return;

    const value = parseInt(document.getElementById('temp-ac-value').value);
    const type = document.getElementById('temp-ac-type').value;
    const duration = type === 'turns' ? parseInt(document.getElementById('temp-ac-duration').value) : null;
    const description = document.getElementById('temp-ac-description').value.trim();

    if (isNaN(value) || value === 0) {
        alert('Введите корректное значение изменения КД');
        return;
    }

    if (type === 'turns' && (isNaN(duration) || duration < 1)) {
        alert('Введите корректную длительность (минимум 1 ход)');
        return;
    }

    const modifier = {
        id: `temp_ac_${Date.now()}`,
        value: value,
        type: type,
        duration: duration,
        description: description || (value >= 0 ? `Бонус +${value} к КД` : `Штраф ${value} к КД`),
        appliedRound: state.battle.round,
        appliedTurn: state.battle.currentTurn
    };

    if (!creature.tempACModifiers) {
        creature.tempACModifiers = [];
    }
    creature.tempACModifiers.push(modifier);

    const newAC = calculateCurrentAC(creature);

    let logMessage = `${creature.name}: `;
    if (value > 0) {
        logMessage += `получил бонус +${value} к КД`;
    } else {
        logMessage += `получил штраф ${value} к КД`;
    }

    if (type === 'turns') {
        logMessage += ` на ${duration} ход(ов)`;
    } else {
        logMessage += ` до снятия`;
    }

    if (description) {
        logMessage += ` (${description})`;
    }

    logMessage += `. Новое КД: ${newAC}`;

    addToLog(logMessage);

    closeModal('temp-ac-modal');
    renderCreatureDetails();
    renderBattle();
    saveToLocalStorage();
}

function removeTempACModifier(creatureIndex, modifierIndex) {
    const creature = state.battle.participants[creatureIndex];
    if (!creature || !creature.tempACModifiers || creature.tempACModifiers.length <= modifierIndex) return;

    const removedMod = creature.tempACModifiers[modifierIndex];
    creature.tempACModifiers.splice(modifierIndex, 1);

    const newAC = calculateCurrentAC(creature);
    addToLog(`${creature.name}: временный модификатор КД "${removedMod.description}" удален. Новое КД: ${newAC}`);

    if (state.currentCreature === creatureIndex) {
        renderCreatureDetails();
        const modal = document.getElementById('temp-ac-modal');
        if (modal.style.display === 'flex') {
            showTempACModal();
        }
    }

    if (creature.groupId) {
        updateGroupMemberDisplay(creatureIndex);
    }

    renderBattle();
    saveToLocalStorage();
}

// ============ РЕДАКТИРОВАНИЕ СУЩЕСТВА В БОЮ ============
function showEditCreatureModal(index) {
    const creature = state.battle.participants[index];
    if (!creature) return;

    state.editCreatureIndex = index;

    document.getElementById('edit-name').value = creature.name;
    document.getElementById('edit-ac').value = creature.ac;
    document.getElementById('edit-attack-bonus').value = creature.attackBonus;
    document.getElementById('edit-damage').value = creature.damage;
    document.getElementById('edit-damage-type').value = creature.damageType;
    setCheckedValues('#edit-resistances-container', 'damage-checkbox', creature.resistances);
    setCheckedValues('#edit-immunities-container', 'immunity-checkbox', creature.immunities);
    setCheckedValues('#edit-vulnerabilities-container', 'vulnerability-checkbox', creature.vulnerabilities);

    document.getElementById('edit-multiattack').value = creature.multiattack || '';
    document.getElementById('edit-legendary-actions').value = creature.legendaryActions ? creature.legendaryActions.join('|') : '';
    document.getElementById('edit-lair-actions').value = creature.lairActions ? creature.lairActions.join('|') : '';
    document.getElementById('edit-color').value = creature.color || '#3498db';

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

    creature.name = document.getElementById('edit-name').value.trim() || creature.name;
    creature.ac = parseInt(document.getElementById('edit-ac').value) || creature.ac;
    creature.attackBonus = parseInt(document.getElementById('edit-attack-bonus').value) || creature.attackBonus;
    creature.damage = document.getElementById('edit-damage').value.trim() || creature.damage;
    creature.damageType = document.getElementById('edit-damage-type').value;

    // Получаем значения из чекбоксов
    creature.resistances = getCheckedValues('#edit-resistances-container', 'damage-checkbox');
    creature.immunities = getCheckedValues('#edit-immunities-container', 'immunity-checkbox');
    creature.vulnerabilities = getCheckedValues('#edit-vulnerabilities-container', 'vulnerability-checkbox');

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

// ============ СИСТЕМА СОСТОЯНИЙ ============
function addCondition() {
    if (state.currentCreature === null) return;

    const creature = state.battle.participants[state.currentCreature];
    const conditionKey = document.getElementById('condition-select').value;

    if (!conditionKey) {
        alert('Выберите состояние!');
        return;
    }

    const conditionInfo = CONDITIONS[conditionKey];
    if (!conditionInfo) {
        alert('Неизвестное состояние');
        return;
    }

    let durationInput = document.getElementById('condition-duration');
    let duration = parseInt(durationInput.value);
    const conditionType = document.getElementById('condition-type').value;

    if (conditionInfo.maxDuration && duration > conditionInfo.maxDuration) {
        duration = conditionInfo.maxDuration;
        addToLog(`Длительность ограничена до ${conditionInfo.maxDuration} ходов`);
    }

    if (conditionKey === 'exhaustion') {
        const level = parseInt(document.getElementById('exhaustion-level').value) || 1;
        if (level < 1 || level > 6) {
            alert('Уровень истощения должен быть от 1 до 6');
            return;
        }

        const existingExhaustion = creature.conditions.find(c => c.name === 'exhaustion');
        if (existingExhaustion) {
            const newLevel = Math.min(6, level); // Устанавливаем выбранный уровень
            existingExhaustion.level = newLevel;
            addToLog(`${creature.name}: уровень истощения установлен на ${newLevel}`);
        } else {
            creature.conditions.push({
                id: `cond_${Date.now()}`,
                name: conditionKey,
                level: level,
                duration: null,
                isPermanent: true,
                appliedRound: state.battle.round,
                appliedTurn: state.battle.currentTurn
            });
            addToLog(`${creature.name} получил истощение ${level} уровня`);
        }

        applyExhaustionEffects(creature);

    } else {
        let actualDuration;
        let isPermanentFlag;

        if (conditionType === 'permanent' || conditionInfo.type === 'permanent') {
            actualDuration = null;
            isPermanentFlag = true;
        } else if (conditionInfo.type === 'special') {
            actualDuration = null;
            isPermanentFlag = false;
        } else {
            actualDuration = duration;
            isPermanentFlag = false;
        }

        const existingIndex = creature.conditions.findIndex(c => c.name === conditionKey);
        if (existingIndex !== -1) {
            const existing = creature.conditions[existingIndex];
            existing.duration = actualDuration;
            existing.isPermanent = isPermanentFlag;
            addToLog(`${creature.name}: состояние "${conditionInfo.name}" обновлено`);
        } else {
            creature.conditions.push({
                id: `cond_${Date.now()}`,
                name: conditionKey,
                duration: actualDuration,
                isPermanent: isPermanentFlag,
                appliedRound: state.battle.round,
                appliedTurn: state.battle.currentTurn
            });

            const durationText = actualDuration === null ?
                'до снятия' : `${actualDuration} ходов`;
            addToLog(`${creature.name} получил состояние: ${conditionInfo.name} на ${durationText}`);
        }
    }

    applyConditionEffects(creature);
    renderBattle();
    closeModal('condition-modal');
    saveToLocalStorage();
    renderCreatureDetails();
    renderBattle();
}

function applyExhaustionEffects(creature) {
    const exhaustion = creature.conditions.find(c => c.name === 'exhaustion');
    if (!exhaustion) return;

    const level = exhaustion.level || 1;
    const levelEffects = CONDITIONS.exhaustion.levelEffects[level];

    if (level >= 6) {
        creature.currentHP = 0;
        addToLog(`💀 ${creature.name} погиб от истощения 6 уровня!`);
        applyAutomaticConditions(creature);
    }

    addToLog(`${creature.name}: истощение ${level} уровня - ${levelEffects}`);

    // Обновляем эффекты состояний
    applyConditionEffects(creature);
}


function getConditionName(conditionKey) {
    const info = getConditionInfo(conditionKey);
    return info.name;
}

function getConditionInfo(conditionKey) {
    return CONDITIONS[conditionKey] || {
        name: conditionKey,
        description: 'Неизвестное состояние',
        effects: [],
        maxDuration: 100,
        canBePermanent: false
    };
}

function clearAllConditions(creatureIndex) {
    const creature = state.battle.participants[creatureIndex];
    if (!creature || !creature.conditions || creature.conditions.length === 0) return;

    const conditionNames = creature.conditions.map(c => getConditionName(c.name)).join(', ');
    creature.conditions = [];

    addToLog(`${creature.name}: все состояния сняты (${conditionNames})`);
    applyConditionEffects(creature);

    saveToLocalStorage();
    renderCreatureDetails();
    renderBattle();
}

function removeCondition(conditionId) {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) return;

    const conditionIndex = creature.conditions.findIndex(c => c.id === conditionId);
    if (conditionIndex === -1) return;

    const conditionName = getConditionName(creature.conditions[conditionIndex].name);
    creature.conditions.splice(conditionIndex, 1);

    addToLog(`${creature.name} больше не ${conditionName}`);

    applyConditionEffects(creature);

    saveToLocalStorage();
    renderCreatureDetails();
    renderBattle();
}

function changeConditionDuration(conditionId, change) {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) return;

    const condition = creature.conditions.find(c => c.id === conditionId);
    if (!condition || condition.isPermanent) return;

    const info = getConditionInfo(condition.name);
    const newDuration = condition.duration + change;

    if (newDuration < 1) {
        removeCondition(conditionId);
        return;
    }

    if (info.maxDuration && newDuration > info.maxDuration) {
        condition.duration = info.maxDuration;
        addToLog(`Максимальная длительность для "${info.name}" - ${info.maxDuration} ходов`);
    } else {
        condition.duration = newDuration;
    }

    const conditionName = getConditionName(condition.name);
    addToLog(`${creature.name}: длительность "${conditionName}" изменена на ${condition.duration} ходов`);

    saveToLocalStorage();
    renderCreatureDetails();
}

function changeExhaustionLevel(conditionId, change) {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) return;

    const condition = creature.conditions.find(c => c.id === conditionId);
    if (!condition || condition.name !== 'exhaustion') return;

    let newLevel = (condition.level || 1) + change;

    if (newLevel < 1) {
        // Если уровень стал меньше 1, удаляем состояние
        removeCondition(conditionId);
        return;
    }

    if (newLevel > 6) {
        newLevel = 6;
        addToLog(`Максимальный уровень истощения - 6`);
    }

    condition.level = newLevel;
    addToLog(`${creature.name}: уровень истощения изменен на ${newLevel}`);

    // Применяем эффекты истощения
    applyExhaustionEffects(creature);

    saveToLocalStorage();
    renderCreatureDetails();
    renderBattle();
}

// Обновляем функцию showConditionModal для правильной работы с истощением
function showConditionModal() {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) {
        alert('Сначала выберите существо!');
        return;
    }

    const conditionSelect = document.getElementById('condition-select');
    conditionSelect.innerHTML = '<option value="">Выберите состояние</option>';

    Object.entries(CONDITIONS).forEach(([key, info]) => {
        if (key !== 'concentration') {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = info.name;
            option.title = info.description;
            conditionSelect.appendChild(option);
        }
    });

    document.getElementById('condition-duration').value = '1';
    document.getElementById('condition-type').value = 'temporary';
    document.getElementById('exhaustion-level').value = '1';

    const descriptionDiv = document.getElementById('condition-description');
    descriptionDiv.style.display = 'none';

    // Проверяем, есть ли уже истощение у существа
    const existingExhaustion = creature.conditions.find(c => c.name === 'exhaustion');
    if (existingExhaustion) {
        document.getElementById('exhaustion-level').value = existingExhaustion.level || 1;
    }

    const conditionSelectElement = document.getElementById('condition-select');
    const conditionTypeGroup = document.getElementById('condition-type-group');
    const exhaustionGroup = document.getElementById('exhaustion-level-group');
    const durationGroup = document.getElementById('condition-duration-group');

    // Удаляем старые обработчики событий, если они есть
    conditionSelectElement.removeEventListener('change', handleConditionChange);

    // Создаем новый обработчик
    function handleConditionChange() {
        const conditionKey = this.value;
        const conditionInfo = CONDITIONS[conditionKey];

        if (conditionInfo) {
            descriptionDiv.innerHTML = `<strong>${conditionInfo.name}:</strong> ${conditionInfo.description}`;
            descriptionDiv.style.display = 'block';

            exhaustionGroup.style.display = conditionKey === 'exhaustion' ? 'block' : 'none';

            if (conditionInfo.canBePermanent) {
                conditionTypeGroup.style.display = 'block';
            } else {
                conditionTypeGroup.style.display = 'none';
                document.getElementById('condition-type').value = 'temporary';
            }

            const durationInput = document.getElementById('condition-duration');
            if (conditionInfo.maxDuration) {
                durationInput.max = conditionInfo.maxDuration;
                durationInput.value = Math.min(conditionInfo.defaultDuration || 1, conditionInfo.maxDuration);
            } else {
                durationInput.max = 100;
                durationInput.value = conditionInfo.defaultDuration || 1;
            }

            if (conditionInfo.type === 'special' || conditionInfo.type === 'permanent' || conditionInfo.type === 'exhaustion') {
                durationGroup.style.display = 'none';
            } else {
                durationGroup.style.display = 'block';
            }

            // Если выбрано истощение и у существа уже есть истощение, показываем текущий уровень
            if (conditionKey === 'exhaustion' && existingExhaustion) {
                document.getElementById('exhaustion-level').value = existingExhaustion.level || 1;
            }
        } else {
            descriptionDiv.style.display = 'none';
        }
    }

    conditionSelectElement.addEventListener('change', handleConditionChange);

    // Вызываем обработчик для инициализации
    handleConditionChange.call(conditionSelectElement);

    showModal('condition-modal');
}

function applyAutomaticConditions(creature) {
    if (creature.currentHP <= 0 && !creature.conditions.some(c => c.name === 'unconscious')) {
        creature.conditions.push({
            id: `cond_${Date.now()}`,
            name: 'unconscious',
            duration: null,
            isPermanent: true,
            appliedRound: state.battle.round,
            appliedTurn: state.battle.currentTurn
        });
        addToLog(`💀 ${creature.name} потерял сознание!`);

        // Сбрасываем спасброски при первом падении в 0 HP
        if (!creature.deathSaves) {
            creature.deathSaves = { successes: 0, failures: 0 };
        }

        applyConditionEffects(creature);
    }

    if (creature.currentHP > 0) {
        const unconsciousIndex = creature.conditions.findIndex(c => c.name === 'unconscious');
        if (unconsciousIndex !== -1) {
            const condition = creature.conditions[unconsciousIndex];
            creature.conditions.splice(unconsciousIndex, 1);

            // Сбрасываем спасброски при восстановлении сознания
            creature.deathSaves = { successes: 0, failures: 0 };
            creature.stabilized = false;
            creature.dead = false;

            addToLog(`${creature.name} пришёл в сознание!`);
            applyConditionEffects(creature);
        }
    }
}

function applyConditionEffects(creature) {
    if (!creature.conditions || creature.conditions.length === 0) {
        creature.conditionEffects = {};
        return;
    }

    let effects = {
        hasDisadvantageOnAttacks: false,
        hasAdvantageOnAttacks: false,
        attacksAgainstHaveAdvantage: false,
        attacksAgainstHaveDisadvantage: false,
        speedMultiplier: 1,
        canTakeActions: true,
        canTakeReactions: true,
        autoFailStrengthSaves: false,
        autoFailDexteritySaves: false,
        isCritVulnerable: false,
        hasResistanceToAllDamage: false,
        hasPoisonImmunity: false,
        hasDisadvantageOnAbilityChecks: false,
        hasDisadvantageOnSaves: false,
        maxHPMultiplier: 1
    };

    creature.conditions.forEach(condition => {
        const info = getConditionInfo(condition.name);
        const level = condition.level || 1;

        switch (condition.name) {
            case 'blinded':
                effects.attacksAgainstHaveAdvantage = true;
                effects.hasDisadvantageOnAttacks = true;
                break;

            case 'charmed':
                break;

            case 'frightened':
                effects.hasDisadvantageOnAttacks = true;
                break;

            case 'grappled':
            case 'restrained':
                effects.speedMultiplier = 0;
                effects.attacksAgainstHaveAdvantage = true;
                effects.hasDisadvantageOnAttacks = true;
                if (condition.name === 'restrained') {
                    effects.autoFailDexteritySaves = true;
                }
                break;

            case 'paralyzed':
            case 'stunned':
            case 'unconscious':
            case 'petrified':
                effects.canTakeActions = false;
                effects.canTakeReactions = false;
                effects.speedMultiplier = 0;
                effects.attacksAgainstHaveAdvantage = true;
                effects.autoFailStrengthSaves = true;
                effects.autoFailDexteritySaves = true;

                if (condition.name === 'unconscious' || condition.name === 'paralyzed') {
                    effects.isCritVulnerable = true;
                }

                if (condition.name === 'petrified') {
                    effects.hasResistanceToAllDamage = true;
                    effects.hasPoisonImmunity = true;
                }
                break;

            case 'poisoned':
                effects.hasDisadvantageOnAttacks = true;
                break;

            case 'prone':
                effects.hasDisadvantageOnAttacks = true;
                break;

            case 'invisible':
                effects.attacksAgainstHaveDisadvantage = true;
                effects.hasAdvantageOnAttacks = true;
                break;

            case 'deafened':
                break;

            case 'exhaustion':
                // Уровень 1: Помеха на проверки характеристик
                if (level >= 1) {
                    effects.hasDisadvantageOnAbilityChecks = true;
                }

                // Уровень 2: Скорость уменьшена вдвое
                if (level >= 2) {
                    effects.speedMultiplier *= 0.5;
                }

                // Уровень 3: Помеха на броски атаки и спасброски
                if (level >= 3) {
                    effects.hasDisadvantageOnAttacks = true;
                    effects.hasDisadvantageOnSaves = true;
                }

                // Уровень 4: Максимум хитов уменьшен вдвое
                if (level >= 4) {
                    effects.maxHPMultiplier *= 0.5;
                    // Применяем изменение к текущим HP если нужно
                    const newMaxHP = Math.floor(creature.originalMaxHP * effects.maxHPMultiplier);
                    if (creature.currentHP > newMaxHP) {
                        creature.currentHP = newMaxHP;
                    }
                }

                // Уровень 5: Скорость = 0 (перезаписывает эффект уровня 2)
                if (level >= 5) {
                    effects.speedMultiplier = 0;
                }

                // Уровень 6: Смерть
                if (level >= 6) {
                    creature.currentHP = 0;
                    addToLog(`💀 ${creature.name} погиб от истощения 6 уровня!`);
                }
                break;

            case 'incapacitated':
                effects.canTakeActions = false;
                effects.canTakeReactions = false;
                if (creature.conditions.some(c => c.name === 'concentration')) {
                    const concentration = creature.conditions.find(c => c.name === 'concentration');
                    removeCondition(concentration.id);
                }
                break;
        }
    });

    creature.conditionEffects = effects;

    // Применяем изменение максимальных HP при наличии истощения 4+ уровня
    const exhaustion = creature.conditions.find(c => c.name === 'exhaustion');
    if (exhaustion && exhaustion.level >= 4) {
        // Сохраняем оригинальное максимальное HP если еще не сохранено
        if (!creature.originalMaxHP) {
            creature.originalMaxHP = creature.maxHP;
        }
        // Обновляем текущее максимальное HP
        creature.maxHP = Math.floor(creature.originalMaxHP * effects.maxHPMultiplier);
        if (creature.currentHP > creature.maxHP) {
            creature.currentHP = creature.maxHP;
        }
    } else if (creature.originalMaxHP) {
        // Если истощение уровня 4+ снято, восстанавливаем оригинальное максимальное HP
        creature.maxHP = creature.originalMaxHP;
        delete creature.originalMaxHP;
    }
}

function getConditionColor(conditionKey) {
    const colors = {
        'blinded': '#2d3436',
        'charmed': '#e84393',
        'frightened': '#e17055',
        'grappled': '#00cec9',
        'paralyzed': '#0984e3',
        'petrified': '#636e72',
        'poisoned': '#00b894',
        'prone': '#fdcb6e',
        'restrained': '#6c5ce7',
        'stunned': '#e74c3c',
        'unconscious': '#2d3436',
        'invisible': '#00cec9',
        'deafened': '#7f8c8d',
        'exhaustion': '#8e44ad',
        'incapacitated': '#34495e',
        'concentration': '#9b59b6'
    };

    return colors[conditionKey] || '#3498db';
}

function decrementConditionDurations(creature) {
    if (!creature.conditions || creature.conditions.length === 0) return;

    creature.conditions.forEach(condition => {
        if (!condition.isPermanent && condition.duration !== null && condition.duration > 0) {
            condition.duration--;
        }
    });

    creature.conditions = creature.conditions.filter(condition => {
        if (condition.isPermanent || condition.duration === null) {
            return true;
        }

        if (condition.duration > 0) {
            return true;
        }

        addToLog(`${creature.name}: состояние "${getConditionName(condition.name)}" закончилось`);
        return false;
    });

    applyConditionEffects(creature);
}

// ============ УРОН И ЛЕЧЕНИЕ ============
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

        let damageDealt = 0;

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
            // При лечении сбрасываем спасброски от смерти
            creature.deathSaves = { successes: 0, failures: 0 };
            creature.stabilized = false;
            creature.dead = false;

            creature.currentHP += damageAmount;
            if (creature.currentHP > creature.maxHP) creature.currentHP = creature.maxHP;
            addToLog(`${creature.name} вылечен на ${damageAmount} HP`);
        } else {
            const originalTempHP = creature.tempHP;
            addToLog(`${creature.name} получил ${damageAmount} урона (${type})`);

            if (creature.tempHP > 0) {
                const damageToTemp = Math.min(damageAmount, creature.tempHP);
                creature.tempHP -= damageToTemp;
                damageAmount -= damageToTemp;

                damageDealt += damageToTemp;
            }

            if (damageAmount > 0) {
                creature.currentHP -= damageAmount;
                if (creature.currentHP < 0) creature.currentHP = 0;

                damageDealt += damageAmount;
            }

            const totalDamageTaken = damageDealt;

            if (creature.currentHP <= 0) {
                addToLog(`💀 ${creature.name} погиб!`);
                // При получении урона в 0 HP сбрасываем стабилизацию
                creature.stabilized = false;
            }

            if (totalDamageTaken > 0 && creature.conditions.some(c => c.name === 'concentration')) {
                const concentrationDC = Math.max(10, Math.floor(totalDamageTaken / 2));
                const concentrationRoll = Math.floor(Math.random() * 20) + 1;
                const conBonus = 0;

                if (concentrationRoll + conBonus < concentrationDC) {
                    creature.conditions = creature.conditions.filter(c => c.name !== 'concentration');
                    addToLog(`${creature.name} потерял концентрацию (бросок: ${concentrationRoll + conBonus} против СЛ ${concentrationDC})`);
                } else {
                    addToLog(`${creature.name} сохранил концентрацию (бросок: ${concentrationRoll + conBonus} против СЛ ${concentrationDC})`);
                }
            }

            // Проверяем автоматические состояния (бессознательное)
            applyAutomaticConditions(creature);
        }

        if (creature.groupId) {
            updateGroupMemberDisplay(state.currentCreature);
        }

        saveToLocalStorage();
        renderBattle();
        renderCreatureDetails();
    }

    closeModal('damage-modal');
}

// ============ БРОСКИ КУБОВ ============
function rollDice(dice) {
    const match = dice.match(/d(\d+)/);
    if (!match) return;

    const sides = parseInt(match[1]);
    const result = Math.floor(Math.random() * sides) + 1;

    const message = `Бросок ${dice}: <strong>${result}</strong>`;
    showRollResult(message);
    addToLog(`Бросок ${dice}: ${result}`);
}

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

function evalDiceExpression(expr) {
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

    return eval(expr);
}

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

function showRollResult(message, type = 'normal') {
    const resultDiv = document.getElementById('roll-result');
    resultDiv.innerHTML = message;
    resultDiv.className = `roll-result ${type}`;
}

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

    if (isCrit && creature.damage) {
        setTimeout(() => rollDamage(true), 1000);
    }
}

function rollDamage(isCrit = false) {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature.damage) return;

    let damageExpr = creature.damage;

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

// ============ СБРОС БОЯ ============
function resetBattle() {
    if (!confirm('Сбросить бой в начальное состояние?\n\nЭто вернет все HP к максимуму, обнулит временные HP, состояния, и сбросит раунды, но сохранит существ в инициативе.')) {
        return;
    }

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

    state.battle.participants.forEach(participant => {
        const original = state.creatures.find(c => c.id === participant.id);
        const resetData = creatureResetMap[participant.id];

        if (resetData) {
            participant.currentHP = resetData.maxHP;
            participant.maxHP = resetData.maxHP;
            participant.originalMaxHP = resetData.maxHP;
            participant.ac = resetData.ac;
            participant.attackBonus = resetData.attackBonus;
            participant.damage = resetData.damage;
            participant.damageType = resetData.damageType;
            participant.resistances = [...resetData.resistances];
            participant.immunities = [...resetData.immunities];
            participant.vulnerabilities = [...resetData.vulnerabilities];
        } else if (original) {
            participant.currentHP = original.maxHP;
            participant.maxHP = original.maxHP;
            participant.originalMaxHP = original.maxHP;
        } else {
            participant.currentHP = participant.maxHP;
        }

        participant.tempHP = 0;
        participant.conditions = [];
        participant.concentration = false;
        participant.usedLegendaryActions = 0;
        participant.usedLairActions = false;
    });

    state.battle.round = 1;
    state.battle.currentTurn = 0;

    state.battle.log = [];
    document.getElementById('battle-log').innerHTML = '';

    renderBattle();
    updateRoundDisplay();
    saveToLocalStorage();

    addToLog('=== БОЙ СБРОШЕН В НАЧАЛЬНОЕ СОСТОЯНИЕ ===');
    addToLog('Все HP восстановлены, состояния сброшены');
}

function toggleConcentration() {
    const creature = state.battle.participants[state.currentCreature];
    if (!creature) return;

    const concentrationCondition = creature.conditions.find(c => c.name === 'concentration');

    if (concentrationCondition) {
        creature.conditions = creature.conditions.filter(c => c.name !== 'concentration');
        addToLog(`${creature.name} потерял концентрацию`);
    } else {
        creature.conditions.push({
            id: `cond_${Date.now()}`,
            name: 'concentration',
            duration: null,
            isPermanent: true,
            type: 'concentration'
        });
        addToLog(`${creature.name} сконцентрировался`);
    }
    if (creature.groupId) {
        updateGroupMemberDisplay(state.currentCreature);
    }
    renderBattle();
    renderCreatureDetails();
    saveToLocalStorage();
}

// ============ БЫСТРЫЙ NPC ============
function showQuickNPCModal() {
    document.getElementById('quick-npc-name').value = '';
    document.getElementById('quick-npc-hp').value = '';
    document.getElementById('quick-npc-ac').value = '';
    document.getElementById('quick-npc-initiative').value = '';
    document.getElementById('quick-npc-color').value = '#3498db';

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
        color: color,
        legendaryActions: [],
        lairActions: []
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
    const current = state.battle.participants[state.battle.currentTurn];
    if (current) {
        decrementConditionDurations(current);
        current.conditions = current.conditions.filter(cond => {
            if (cond.duration !== null) {
                cond.duration--;
            }
            return cond.duration === null || cond.duration > 0;
        });

        if (current.tempACModifiers && current.tempACModifiers.length > 0) {
            current.tempACModifiers.forEach(mod => {
                if (mod.type === 'turns' && mod.duration > 0) {
                    mod.duration--;
                }
            });

            current.tempACModifiers = current.tempACModifiers.filter(mod => {
                if (mod.type === 'turns') {
                    return mod.duration > 0;
                }
                return mod.type === 'until_removed';
            });

            if (current.groupId) {
                updateGroupMemberDisplay(state.battle.currentTurn);
            }
        }

        applyConditionEffects(current);

        if (current.currentHP <= 0 && !current.stabilized && !current.dead) {
            const roll = Math.floor(Math.random() * 20) + 1;
            const isSuccess = roll >= 10;

            if (isSuccess) {
                current.deathSaves.successes = Math.min(3, current.deathSaves.successes + 1);
                addToLog(`${current.name}: автоматический спасбросок от смерти: ${roll} - УСПЕХ (${current.deathSaves.successes}/3)`);

                if (current.deathSaves.successes >= 3) {
                    current.stabilized = true;
                    addToLog(`✨ ${current.name} стабилизирован!`);
                }
            } else {
                current.deathSaves.failures = Math.min(3, current.deathSaves.failures + 1);
                addToLog(`${current.name}: автоматический спасбросок от смерти: ${roll} - ПРОВАЛ (${current.deathSaves.failures}/3)`);

                if (current.deathSaves.failures >= 3) {
                    current.dead = true;
                    addToLog(`💀 ${current.name} погиб от проваленных спасбросков от смерти!`);
                }
            }
        }

    }

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

    const current = state.battle.participants[state.battle.currentTurn];
    if (current) {
        current.conditions.forEach(cond => {
            if (cond.duration !== null) {
                cond.duration++;
            }
        });

        if (current.tempACModifiers) {
            current.tempACModifiers.forEach(mod => {
                if (mod.type === 'turns') {
                    mod.duration++;
                }
            });
        }

        applyConditionEffects(current);
    }

    state.battle.currentTurn = (state.battle.currentTurn - 1 + state.battle.participants.length) % state.battle.participants.length;

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

function updateRoundDisplay() {
    document.getElementById('round-count').textContent = state.battle.round;
}

// ============ МОДАЛЬНЫЕ ОКНА ============
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';

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

    switch (rollType) {
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

    input.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function () {
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

                // Применяем эффекты состояний ко всем существам после загрузки
                state.battle.participants.forEach(creature => {
                    applyConditionEffects(creature);
                });

                addToLog(`Сессия загружена из файла (${file.name})`);
            } catch (err) {
                alert('Ошибка загрузки файла: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

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

    creature.originalAC = newAC;

    const currentDisplayAC = calculateCurrentAC(creature);
    display.innerHTML = `${currentDisplayAC} 
        ${creature.tempACModifiers && creature.tempACModifiers.length > 0 ?
            `<small style="color: #666;">(база: ${newAC})</small>` : ''}`;

    display.style.display = 'inline-block';
    edit.style.display = 'none';

    if (oldAC !== newAC) {
        addToLog(`${creature.name}: базовое КД изменено с ${oldAC} на ${newAC}`);
    }

    renderBattle();
    saveToLocalStorage();
}

function changeAC(index, amount) {
    const creature = state.battle.participants[index];
    if (!creature) return;

    const oldAC = creature.ac;
    creature.ac = Math.max(0, oldAC + amount);

    const display = document.getElementById(`ac-display-${index}`);
    if (display) {
        display.textContent = creature.ac;
    }

    const changeText = amount >= 0 ? `+${amount}` : amount;
    addToLog(`${creature.name}: КД изменено ${changeText} (с ${oldAC} на ${creature.ac})`);

    renderBattle();
    saveToLocalStorage();
}

function clearBattleWithSave() {
    if (state.battle.participants.length === 0) {
        alert('В бою нет существ для сохранения');
        return;
    }

    if (!confirm(`Очистить бой и сохранить ${state.battle.participants.length} существ в бестиарий?\n\nСущества, которых нет в бестиарии, будут добавлены туда.`)) {
        return;
    }

    let savedCount = 0;
    let skippedCount = 0;

    state.battle.participants.forEach(battleCreature => {
        const baseName = battleCreature.baseName ||
            battleCreature.name.replace(/\s+\d+$/, '')
                .replace(/\s+[IVXLCDM]+$/, '')
                .replace(/\s+[A-Z]$/, '');

        const existsInBestiary = state.creatures.some(bestiaryCreature => {
            if (bestiaryCreature.id === battleCreature.id) {
                return true;
            }

            const bestiaryBaseName = bestiaryCreature.baseName ||
                bestiaryCreature.name.replace(/\s+\d+$/, '')
                    .replace(/\s+[IVXLCDM]+$/, '')
                    .replace(/\s+[A-Z]$/, '');

            return bestiaryBaseName.toLowerCase() === baseName.toLowerCase();
        });

        if (!existsInBestiary) {
            const creatureToSave = {
                id: Date.now() + savedCount + skippedCount,
                name: baseName,
                baseName: baseName,
                maxHP: battleCreature.maxHP,
                ac: battleCreature.originalAC || battleCreature.ac,
                initBonus: battleCreature.initBonus || 0,
                attackBonus: battleCreature.originalAttackBonus || battleCreature.attackBonus,
                damage: battleCreature.originalDamage || battleCreature.damage,
                damageType: battleCreature.originalDamageType || battleCreature.damageType,
                resistances: battleCreature.resistances || [],
                immunities: battleCreature.immunities || [],
                vulnerabilities: battleCreature.vulnerabilities || [],
                multiattack: battleCreature.multiattack || '',
                legendaryActions: battleCreature.legendaryActions || [],
                lairActions: battleCreature.lairActions || [],
                color: battleCreature.color || '#3498db'
            };

            state.creatures.push(creatureToSave);
            savedCount++;
        } else {
            skippedCount++;
        }
    });

    state.battle.participants = [];
    state.battle.currentTurn = 0;
    state.battle.round = 1;
    state.currentCreature = null;

    saveToLocalStorage();

    renderBattle();
    renderSavedCreatures();

    addToLog(`=== БОЙ ОЧИЩЕН ===`);
    addToLog(`Добавлено в бестиарий: ${savedCount} новых существ`);
    addToLog(`Пропущено (уже есть в бестиарии): ${skippedCount} существ`);

    if (savedCount > 0) {
        alert(`Бой очищен. В бестиарий добавлено ${savedCount} новых существ. ${skippedCount} существ уже были в бестиарии.`);
    } else {
        alert('Бой очищен. Все существа уже были в бестиарии.');
    }
}

function saveCreatureToBestiary(creatureIndex) {
    const creature = state.battle.participants[creatureIndex];
    if (!creature) return;

    const baseName = extractBaseName(creature.name);

    const existsInBestiary = state.creatures.some(bestiaryCreature => {
        if (bestiaryCreature.id === creature.id) {
            return true;
        }

        const bestiaryBaseName = extractBaseName(bestiaryCreature.name);
        return bestiaryBaseName.toLowerCase() === baseName.toLowerCase();
    });

    if (existsInBestiary) {
        alert(`Существо "${baseName}" уже есть в бестиарии!`);
        return;
    }

    const creatureToSave = {
        id: Date.now(),
        name: baseName,
        baseName: baseName,
        maxHP: creature.maxHP,
        ac: creature.originalAC || creature.ac,
        initBonus: creature.initBonus || 0,
        attackBonus: creature.originalAttackBonus || creature.attackBonus,
        damage: creature.originalDamage || creature.damage,
        damageType: creature.originalDamageType || creature.damageType,
        resistances: creature.resistances || [],
        immunities: creature.immunities || [],
        vulnerabilities: creature.vulnerabilities || [],
        multiattack: creature.multiattack || '',
        legendaryActions: creature.legendaryActions || [],
        lairActions: creature.lairActions || [],
        color: creature.color || '#3498db',
        tempACModifiers: []
    };

    state.creatures.push(creatureToSave);
    saveToLocalStorage();
    renderSavedCreatures();

    addToLog(`Существо "${baseName}" сохранено в бестиарий`);
    alert(`Существо "${baseName}" сохранено в бестиарий!`);
}

function saveCreatureFromBattle(index) {
    const creature = state.battle.participants[index];
    if (!creature) {
        alert('Существо не найдено');
        return;
    }

    const baseName = extractBaseName(creature.name);

    const existsInBestiary = state.creatures.some(bestiaryCreature => {
        if (bestiaryCreature.id === creature.id) {
            return true;
        }

        const bestiaryBaseName = extractBaseName(bestiaryCreature.name);
        return bestiaryBaseName.toLowerCase() === baseName.toLowerCase();
    });

    if (existsInBestiary) {
        alert(`Существо "${baseName}" уже есть в бестиарии!`);
        return;
    }

    const creatureToSave = {
        id: Date.now(),
        name: baseName,
        baseName: baseName,
        maxHP: creature.maxHP,
        ac: creature.originalAC || creature.ac,
        initBonus: creature.initBonus || 0,
        attackBonus: creature.originalAttackBonus || creature.attackBonus,
        damage: creature.originalDamage || creature.damage,
        damageType: creature.originalDamageType || creature.damageType,
        resistances: creature.resistances || [],
        immunities: creature.immunities || [],
        vulnerabilities: creature.vulnerabilities || [],
        multiattack: creature.multiattack || '',
        legendaryActions: creature.legendaryActions || [],
        lairActions: creature.lairActions || [],
        color: creature.color || '#3498db'
    };

    state.creatures.push(creatureToSave);
    saveToLocalStorage();
    renderSavedCreatures();

    addToLog(`Существо "${baseName}" сохранено в бестиарий`);
    alert(`Существо "${baseName}" успешно сохранено в бестиарий!`);
}

function extractBaseName(name) {
    if (!name) return '';

    return name.replace(/\s+\d+$/, '')
        .replace(/\s+[IVXLCDM]+$/, '')
        .replace(/\s+[A-Z]$/, '');
}

function viewCreatureDetails(creatureId) {
    const creature = state.creatures.find(c => c.id === creatureId);
    if (!creature) return;

    const container = document.getElementById('view-creature-content');

    const damageTypeColor = getDamageTypeColor(creature.damageType);

    container.innerHTML = `
        <div class="stat-block" style="border-color: ${creature.color || '#3498db'};">
            <div class="creature-header" style="border-bottom-color: ${creature.color || '#3498db'};">
                <h4 style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                    <span class="creature-color" style="background: ${creature.color || '#3498db'}; width: 25px; height: 25px; border-radius: 50%;"></span>
                    <span>${creature.name}</span>
                    ${creature.legendaryActions && creature.legendaryActions.length > 0 ?
            '<i class="fas fa-crown" title="Имеет легендарные действия" style="color: #f39c12;"></i>' : ''}
                    ${creature.lairActions && creature.lairActions.length > 0 ?
            '<i class="fas fa-mountain" title="Имеет действия логова" style="color: #7f8c8d;"></i>' : ''}
                </h4>
                <div style="font-size: 0.9em; color: #666;">
                    <span>ID: ${creature.id}</span>
                </div>
            </div>
            
            <div class="view-creature-stats">
                <div class="view-stat-item">
                    <label>Максимальное HP</label>
                    <span>${creature.maxHP}</span>
                </div>
                <div class="view-stat-item">
                    <label>Класс Доспеха</label>
                    <span>${creature.ac}</span>
                </div>
                <div class="view-stat-item">
                    <label>Бонус к инициативе</label>
                    <span>${creature.initBonus || 0}</span>
                </div>
                <div class="view-stat-item">
                    <label>Бонус к атаке</label>
                    <span>+${creature.attackBonus}</span>
                </div>
            </div>
            
            <div class="section">
                <h5><i class="fas fa-bolt"></i> Урон</h5>
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <strong>Формула урона:</strong>
                        <div style="font-size: 1.2rem; font-weight: bold; margin-top: 5px;">${creature.damage}</div>
                    </div>
                    <div>
                        <strong>Тип урона:</strong>
                        <div style="margin-top: 5px;">
                            <span class="damage-type" style="background: ${damageTypeColor}; padding: 5px 15px; border-radius: 20px; color: white; font-weight: bold;">
                                ${creature.damageType}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            ${creature.multiattack ? `
                <div class="section">
                    <h5><i class="fas fa-fist-raised"></i> Мультиатака</h5>
                    <div class="view-action-item">${creature.multiattack}</div>
                </div>
            ` : ''}
            
            <div class="section">
                <h5><i class="fas fa-shield-alt"></i> Защита от типов урона</h5>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    ${creature.resistances && creature.resistances.length > 0 ? `
                        <div>
                            <strong style="color: var(--info);">Сопротивления:</strong>
                            <div class="view-damage-types">
                                ${creature.resistances.map(r =>
                `<span class="view-damage-mod resistance">${r}</span>`
            ).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${creature.immunities && creature.immunities.length > 0 ? `
                        <div>
                            <strong style="color: var(--gray);">Иммунитеты:</strong>
                            <div class="view-damage-types">
                                ${creature.immunities.map(i =>
                `<span class="view-damage-mod immunity">${i}</span>`
            ).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${creature.vulnerabilities && creature.vulnerabilities.length > 0 ? `
                        <div>
                            <strong style="color: var(--danger);">Уязвимости:</strong>
                            <div class="view-damage-types">
                                ${creature.vulnerabilities.map(v =>
                `<span class="view-damage-mod vulnerability">${v}</span>`
            ).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            ${creature.legendaryActions && creature.legendaryActions.length > 0 ? `
                <div class="section">
                    <h5><i class="fas fa-crown"></i> Легендарные действия</h5>
                    <div class="view-actions-list">
                        ${creature.legendaryActions.map((action, index) => `
                            <div class="view-action-item legendary">
                                <strong>Действие ${index + 1}:</strong> ${action}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${creature.lairActions && creature.lairActions.length > 0 ? `
                <div class="section">
                    <h5><i class="fas fa-mountain"></i> Действия логова</h5>
                    <div class="view-actions-list">
                        ${creature.lairActions.map((action, index) => `
                            <div class="view-action-item lair">
                                <strong>Действие ${index + 1}:</strong> ${action}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="section">
                <h5><i class="fas fa-info-circle"></i> Дополнительная информация</h5>
                <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <div>
                        <strong>Цвет метки:</strong>
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                            <div class="creature-color" style="background: ${creature.color || '#3498db'}; width: 25px; height: 25px; border-radius: 50%;"></div>
                            <code>${creature.color || '#3498db'}</code>
                        </div>
                    </div>
                    <div>
                        <strong>Дата создания:</strong>
                        <div style="margin-top: 5px;">
                            ${new Date(creature.id).toLocaleString('ru-RU')}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-buttons" style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
                <button onclick="editCreature(${creature.id})" class="btn btn-warning">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button onclick="addSingleToBattle(${creature.id})" class="btn btn-primary">
                    <i class="fas fa-user"></i> Добавить в бой
                </button>
                <button onclick="showAddGroupToBattleModal(${creature.id})" class="btn btn-info">
                    <i class="fas fa-users"></i> Добавить группу
                </button>
            </div>
        </div>
    `;

    showModal('view-creature-modal');
}

function renderDeathSaves(creature, index = null) {
    const isStabilized = creature.stabilized;
    const isDead = creature.dead;
    const isUnconscious = creature.currentHP <= 0 && !creature.dead;

    // Создаем HTML для счетчиков успехов и неудач
    const successesHTML = Array.from({ length: 3 }, (_, i) => `
        <div class="death-save-circle success ${i < creature.deathSaves.successes ? 'filled' : ''}"
             onclick="addDeathSaveSuccess(${index !== null ? index : `'${creature.id}'`})">
            ${i < creature.deathSaves.successes ? '✓' : ''}
        </div>
    `).join('');

    const failuresHTML = Array.from({ length: 3 }, (_, i) => `
        <div class="death-save-circle failure ${i < creature.deathSaves.failures ? 'filled' : ''}"
             onclick="addDeathSaveFailure(${index !== null ? index : `'${creature.id}'`})">
            ${i < creature.deathSaves.failures ? '✗' : ''}
        </div>
    `).join('');

    // HTML для результата (смерть/стабилизация)
    let resultHTML = '';
    if (isDead) {
        resultHTML = `
            <div class="death-saves-result dead">
                <i class="fas fa-skull-crossbones"></i> Смерть
            </div>
        `;
    } else if (isStabilized) {
        resultHTML = `
            <div class="death-saves-result stabilized">
                <i class="fas fa-heartbeat"></i> Стабилизирован
            </div>
        `;
    }

    return `
        <div class="death-saves-container" style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: var(--radius-sm);">
            <div style="text-align: center; margin-bottom: 10px;">
                <h6 style="margin: 0 0 10px 0; color: #333;">
                    <i class="fas fa-heartbeat"></i> Спасброски от смерти
                </h6>
            </div>
            
            <div style="display: flex; justify-content: space-around; align-items: center; margin-bottom: 15px;">
                <div style="text-align: center;">
                    <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">
                        Успехи: ${creature.deathSaves.successes}/3
                    </div>
                    <div style="display: flex; gap: 8px;">
                        ${successesHTML}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">
                        Неудачи: ${creature.deathSaves.failures}/3
                    </div>
                    <div style="display: flex; gap: 8px;">
                        ${failuresHTML}
                    </div>
                </div>
            </div>
            
            ${resultHTML}
            
            ${creature.currentHP <= 0 && !isDead && !isStabilized ? `
                <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
                    <button onclick="rollDeathSave(${index !== null ? index : `'${creature.id}'`})" 
                            class="btn btn-sm btn-primary">
                        <i class="fas fa-dice"></i> Бросить d20
                    </button>
                    <button onclick="resetDeathSaves(parseInt(document.getElementById('death-save-creature-select').value))" 
                                class="btn btn-danger">
                            <i class="fas fa-redo"></i> Сбросить
                        </button>
                </div>
            ` : ''}
        </div>
    `;
}

function rollDeathSave(indexOrId) {
    let creature;
    if (typeof indexOrId === 'number') {
        creature = state.battle.participants[indexOrId];
    } else {
        creature = state.battle.participants.find(c => c.id === indexOrId);
    }

    if (!creature || creature.currentHP > 0 || creature.stabilized || creature.dead) return;

    const roll = Math.floor(Math.random() * 20) + 1;
    let message = '';

    if (roll === 20) {
        // Натуральная 20 - существо возвращается к 1 HP
        creature.currentHP = 1;
        creature.deathSaves = { successes: 0, failures: 0 };
        creature.stabilized = false;

        // Удаляем состояние бессознательного
        const unconsciousIndex = creature.conditions.findIndex(c => c.name === 'unconscious');
        if (unconsciousIndex !== -1) {
            creature.conditions.splice(unconsciousIndex, 1);
        }

        addToLog(`🎯 ${creature.name}: натуральная 20 на спасброске от смерти! Возвращается к 1 HP`);
        message = `Натуральная 20! Возвращается к 1 HP`;
    } else if (roll === 1) {
        // Натуральная 1 - два провала
        const oldFailures = creature.deathSaves.failures;
        creature.deathSaves.failures = Math.min(3, oldFailures + 2);

        if (creature.deathSaves.failures >= 3) {
            creature.dead = true;
            addToLog(`💀 ${creature.name}: натуральная 1 на спасброске от смерти! 2 провала. Существо погибло.`);
            message = `Натуральная 1! 2 провала. Смерть.`;
        } else {
            addToLog(`❌ ${creature.name}: натуральная 1 на спасброске от смерти! 2 провала (${creature.deathSaves.failures}/3)`);
            message = `Натуральная 1! 2 провала`;
        }
    } else if (roll >= 10) {
        // Успех (10 или выше)
        creature.deathSaves.successes = Math.min(3, creature.deathSaves.successes + 1);

        if (creature.deathSaves.successes >= 3) {
            creature.stabilized = true;
            addToLog(`✅ ${creature.name}: успех на спасброске от смерти (${roll}). Существо стабилизировано.`);
            message = `Успех (${roll})! Стабилизирован`;
        } else {
            addToLog(`✅ ${creature.name}: успех на спасброске от смерти (${roll}). Успехов: ${creature.deathSaves.successes}/3`);
            message = `Успех (${roll})`;
        }
    } else {
        // Провал (9 или ниже)
        creature.deathSaves.failures = Math.min(3, creature.deathSaves.failures + 1);

        if (creature.deathSaves.failures >= 3) {
            creature.dead = true;
            addToLog(`❌ ${creature.name}: провал на спасброске от смерти (${roll}). Существо погибло.`);
            message = `Провал (${roll})! Смерть`;
        } else {
            addToLog(`❌ ${creature.name}: провал на спасброске от смерти (${roll}). Провалов: ${creature.deathSaves.failures}/3`);
            message = `Провал (${roll})`;
        }
    }

    // Показываем результат броска
    showRollResult(`Спасбросок от смерти: <strong>${roll}</strong><br>${message}`,
        roll === 20 ? 'critical' : (roll === 1 ? 'danger' : 'normal'));

    updateCreatureDeathSaves(creature);
}

// Функции для управления спасбросками от смерти
function addDeathSaveSuccess(indexOrId) {
    let creature;
    if (typeof indexOrId === 'number') {
        creature = state.battle.participants[indexOrId];
    } else {
        creature = state.battle.participants.find(c => c.id === indexOrId);
    }

    if (!creature || creature.currentHP > 0 || creature.stabilized || creature.dead) return;

    if (creature.deathSaves.successes < 3) {
        creature.deathSaves.successes++;
        addToLog(`${creature.name}: успех спасброска от смерти (${creature.deathSaves.successes}/3)`);

        if (creature.deathSaves.successes >= 3) {
            creature.stabilized = true;
            addToLog(`✨ ${creature.name} стабилизирован!`);
        }

        updateCreatureDeathSaves(creature);
    }
}

function addDeathSaveFailure(indexOrId) {
    let creature;
    if (typeof indexOrId === 'number') {
        creature = state.battle.participants[indexOrId];
    } else {
        creature = state.battle.participants.find(c => c.id === indexOrId);
    }

    if (!creature || creature.currentHP > 0 || creature.stabilized || creature.dead) return;

    if (creature.deathSaves.failures < 3) {
        creature.deathSaves.failures++;
        addToLog(`${creature.name}: провал спасброска от смерти (${creature.deathSaves.failures}/3)`);

        if (creature.deathSaves.failures >= 3) {
            creature.dead = true;
            creature.conditions = creature.conditions.filter(c => c.name !== 'unconscious');
            creature.conditions.push({
                id: `cond_${Date.now()}`,
                name: 'unconscious',
                duration: null,
                isPermanent: true,
                appliedRound: state.battle.round,
                appliedTurn: state.battle.currentTurn
            });
            addToLog(`💀 ${creature.name} погиб от проваленных спасбросков от смерти!`);
        }

        updateCreatureDeathSaves(creature);
    }
}

function resetDeathSaves(indexOrId) {
    let creature;
    if (typeof indexOrId === 'number') {
        creature = state.battle.participants[indexOrId];
    } else {
        creature = state.battle.participants.find(c => c.id === indexOrId);
    }

    if (!creature) return;

    creature.deathSaves = { successes: 0, failures: 0 };
    creature.stabilized = false;

    addToLog(`${creature.name}: спасброски от смерти сброшены`);
    updateCreatureDeathSaves(creature);
}

function stabilizeCreature(indexOrId) {
    let creature;
    if (typeof indexOrId === 'number') {
        creature = state.battle.participants[indexOrId];
    } else {
        creature = state.battle.participants.find(c => c.id === indexOrId);
    }

    if (!creature) return;

    creature.stabilized = true;
    creature.deathSaves.successes = 3;
    addToLog(`✨ ${creature.name} стабилизирован (восстановление сознания через 1d4 часа)`);
    updateCreatureDeathSaves(creature);
}

function updateCreatureDeathSaves(creature) {
    // Обновляем отображение в боевом трекере
    renderBattle();

    // Если это текущее выбранное существо, обновляем детали
    if (state.currentCreature !== null) {
        const currentIndex = state.currentCreature;
        const currentCreature = state.battle.participants[currentIndex];
        if (currentCreature && currentCreature.id === creature.id) {
            renderCreatureDetails();
        }
    }

    saveToLocalStorage();
}

function showDeathSavesModal(creatureIndex) {
    const creature = state.battle.participants[creatureIndex];
    if (!creature) return;

    // Заполняем список существ для выбора
    const select = document.getElementById('death-save-creature-select');
    select.innerHTML = '';

    state.battle.participants.forEach((c, idx) => {
        if (c.currentHP <= 0) {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = c.name;
            if (idx === creatureIndex) {
                option.selected = true;
            }
            select.appendChild(option);
        }
    });

    // Отображаем спасброски для выбранного существа
    document.getElementById('death-saves-modal-container').innerHTML =
        renderDeathSaves(creature, creatureIndex);

    // Добавляем обработчик изменения выбора
    select.onchange = function () {
        const selectedIndex = parseInt(this.value);
        const selectedCreature = state.battle.participants[selectedIndex];
        if (selectedCreature) {
            document.getElementById('death-saves-modal-container').innerHTML =
                renderDeathSaves(selectedCreature, selectedIndex);
        }
    };

    showModal('death-saves-modal');
}

function rollAutomaticDeathSave() {
    const select = document.getElementById('death-save-creature-select');
    const creatureIndex = parseInt(select.value);
    const creature = state.battle.participants[creatureIndex];

    if (!creature || creature.currentHP > 0 || creature.stabilized || creature.dead) {
        alert('Существо не требует спасбросков от смерти');
        return;
    }

    const roll = Math.floor(Math.random() * 20) + 1;
    const isSuccess = roll >= 10;

    if (isSuccess) {
        addDeathSaveSuccess(creatureIndex);
        addToLog(`Автоматический бросок для ${creature.name}: ${roll} - УСПЕХ`);
    } else {
        addDeathSaveFailure(creatureIndex);
        addToLog(`Автоматический бросок для ${creature.name}: ${roll} - ПРОВАЛ`);
    }

    // Обновляем отображение в модальном окне
    document.getElementById('death-saves-modal-container').innerHTML =
        renderDeathSaves(creature, creatureIndex);
}

// Глобальные словари для перевода
const damageTypeTranslation = {
    'slashing': 'Рубящий',
    'piercing': 'Колющий', 
    'bludgeoning': 'Дробящий',
    'fire': 'Огонь',
    'cold': 'Холод',
    'acid': 'Кислота',
    'lightning': 'Электричество',
    'poison': 'Яд',
    'radiant': 'Свет',
    'necrotic': 'Некротический',
    'psychic': 'Психический',
    'force': 'Силовой',
    'thunder': 'Звук'
};

const conditionTranslation = {
    'blinded': 'Ослепление',
    'charmed': 'Очарование',
    'frightened': 'Испуг',
    'grappled': 'Схваченность',
    'paralyzed': 'Паралич',
    'petrified': 'Окаменение',
    'poisoned': 'Отравление',
    'prone': 'Сбит с ног',
    'restrained': 'Ограничение',
    'stunned': 'Оглушение',
    'unconscious': 'Бессознательность',
    'invisible': 'Невидимость',
    'deafened': 'Глухота',
    'exhaustion': 'Истощение',
    'incapacitated': 'Недееспособность'
};

// Вспомогательные функции для перевода
function translateDamageType(type) {
    return damageTypeTranslation[type] || type;
}

function translateCondition(condition) {
    return conditionTranslation[condition] || condition;
}

function getDamageTypeColor(type) {
    const colors = {
        'slashing': '#e74c3c',
        'piercing': '#3498db',
        'bludgeoning': '#8e44ad',
        'fire': '#f39c12',
        'cold': '#1abc9c',
        'acid': '#2ecc71',
        'lightning': '#f1c40f',
        'poison': '#9b59b6',
        'radiant': '#f1c40f',
        'necrotic': '#2c3e50',
        'psychic': '#e84393',
        'force': '#6c5ce7',
        'thunder': '#0984e3'
    };
    return colors[type] || '#7f8c8d';
}