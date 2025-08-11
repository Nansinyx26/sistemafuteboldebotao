const teams = [
    { name: "As águas vivas", players: ["Iara M.", "Elisa O.", "Luiza R.", "Sthefany A."] },
    { name: "Real Madrid", players: ["Bernardo P.", "Isabelly X.", "Guilherme F.", "Bernardo E."] },
    { name: "Grupo Nota 10", players: ["Milena D.", "Milena C.", "Ana Bia", "Lara C."] },
    { name: "Ursinhos Carinhosos", players: ["Valentina B.", "Maria Emanuella", "Ana Carolina", "Valentina R."] },
    { name: "Velozes & Furiosos", players: ["Pedro H. S.", "Luis Miguel", "Pedro Henrique A.", "Melissa"] },
    { name: "Os profissionais sem brincadeira", players: ["Guilherme P.", "Pablo F.", "Gabriel S.", "Angel"] }
];

const gamesList = [
    { team1: 0, team2: 1 }, // As águas vivas × Real Madrid
    { team1: 0, team2: 2 }, // As águas vivas × Grupo Nota 10
    { team1: 0, team2: 3 }, // As águas vivas × Ursinhos Carinhosos
    { team1: 0, team2: 4 }, // As águas vivas × Velozes & Furiosos
    { team1: 0, team2: 5 }, // As águas vivas × Os profissionais sem brincadeira
    { team1: 1, team2: 2 }, // Real Madrid × Grupo Nota 10
    { team1: 1, team2: 3 }, // Real Madrid × Ursinhos Carinhosos
    { team1: 1, team2: 4 }, // Real Madrid × Velozes & Furiosos
    { team1: 1, team2: 5 }, // Real Madrid × Os profissionais sem brincadeira
    { team1: 2, team2: 3 }, // Grupo Nota 10 × Ursinhos Carinhosos
    { team1: 2, team2: 4 }, // Grupo Nota 10 × Velozes & Furiosos
    { team1: 2, team2: 5 }, // Grupo Nota 10 × Os profissionais sem brincadeira
    { team1: 3, team2: 4 }, // Ursinhos Carinhosos × Velozes & Furiosos
    { team1: 3, team2: 5 }, // Ursinhos Carinhosos × Os profissionais sem brincadeira
    { team1: 4, team2: 5 } // Velozes & Furiosos × Os profissionais sem brincadeira
];

// CHAVE ÚNICA PARA TURMA 4C
const STORAGE_KEY = 'dados_campeonato_4C';

// Estado do jogo
let currentGameIndex = 0;
let games = [];
let scorers = {};
let chart = null;
let standings = {};
let timerInterval = null;
let timeRemaining = 600;
let isTimerRunning = false;

// FUNÇÕES DE SALVAMENTO CORRIGIDAS
function saveGameData() {
    try {
        const gameData = {
            games,
            scorers,
            standings,
            currentGameIndex,
            timestamp: Date.now(),
            turma: '4C'
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
        console.log('✅ Dados da Turma 4C salvos com sucesso!');
        showNotification('💾 Dados salvos com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
        showNotification('❌ Erro ao salvar dados!');
        return false;
    }
}

function loadGameData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const gameData = JSON.parse(savedData);

            if (gameData.games && gameData.scorers && gameData.standings && gameData.turma === '4C') {
                games = gameData.games;
                scorers = gameData.scorers;
                standings = gameData.standings;
                currentGameIndex = gameData.currentGameIndex || 0;

                console.log('✅ Dados da Turma 4C carregados com sucesso!');
                return true;
            }
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        localStorage.removeItem(STORAGE_KEY);
    }
    return false;
}

function resetTournament() {
    if (confirm('⚠️ Tem certeza que deseja resetar todo o campeonato da Turma 4C?\n\nTodos os jogos, gols e classificações serão perdidos!')) {
        localStorage.removeItem(STORAGE_KEY);
        currentGameIndex = 0;
        scorers = {};

        initializeGames();
        initializeStandings();
        loadCurrentGame();
        updateResults();
        updateStandings();
        updateChart();

        showNotification('🔄 Campeonato da Turma 4C resetado com sucesso!');
    }
}

// Inicialização
function init() {
    console.log('🚀 Inicializando Turma 4C...');
    const dataLoaded = loadGameData();

    if (!dataLoaded) {
        console.log('📝 Criando novos dados para Turma 4C...');
        initializeGames();
        initializeStandings();
        saveGameData(); // Salvar dados iniciais
    }

    renderTeams();
    loadCurrentGame();
    updateResults();
    updateStandings();
    updateChart();

    // Adicionar botão de reset
    setTimeout(addResetButton, 100);

    // Mostrar info se dados foram carregados
    if (dataLoaded) {
        const finishedGames = games.filter(game => game.finished).length;
        if (finishedGames > 0) {
            showNotification(`✅ Turma 4C: ${finishedGames} jogos carregados`);
        }
    }
}

function initializeGames() {
    games = gamesList.map((game, index) => ({
        id: index + 1,
        team1: teams[game.team1],
        team2: teams[game.team2],
        goals1: 0,
        goals2: 0,
        finished: false,
        winner: null,
        playerGoals: {}
    }));
}

function initializeStandings() {
    standings = {};
    teams.forEach(team => {
        standings[team.name] = {
            games: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            points: 0
        };
    });
}

function renderTeams() {
    const container = document.getElementById('teamsList');
    container.innerHTML = teams.map(team => `
        <div class="team-card">
            <strong>⚽ ${team.name}</strong>
            <div style="margin-top: 0.5rem; color: var(--text-secondary);">
                ${team.players.join(', ')}
            </div>
        </div>
    `).join('');
}

function loadCurrentGame() {
    if (currentGameIndex >= games.length) {
        showTournamentComplete();
        return;
    }

    const game = games[currentGameIndex];

    // Atualizar cabeçalho do jogo
    document.getElementById('gameNumber').textContent = `Jogo ${currentGameIndex + 1} de ${games.length}`;
    document.getElementById('matchDisplay').textContent = `${game.team1.name} × ${game.team2.name}`;

    // Atualizar nomes dos times
    document.getElementById('team1Name').textContent = game.team1.name;
    document.getElementById('team2Name').textContent = game.team2.name;
    document.getElementById('team1ControlName').textContent = game.team1.name;
    document.getElementById('team2ControlName').textContent = game.team2.name;

    // Resetar gols
    document.getElementById('team1Goals').textContent = '0';
    document.getElementById('team2Goals').textContent = '0';

    // Resetar timer
    resetTimer();

    // Carregar jogadores
    loadPlayers();
    loadQuickGoalSelectors();

    // Esconder resultado anterior
    document.getElementById('winnerDisplay').style.display = 'none';
    document.getElementById('finishBtn').style.display = 'block';
}

function loadQuickGoalSelectors() {
    const game = games[currentGameIndex];

    // Carregar jogadores do time 1
    const team1Select = document.getElementById('team1PlayerSelect');
    team1Select.innerHTML = '<option value="">Selecione jogador</option>' +
        game.team1.players.map((player, index) =>
            `<option value="${index}">${player}</option>`
        ).join('');

    // Carregar jogadores do time 2
    const team2Select = document.getElementById('team2PlayerSelect');
    team2Select.innerHTML = '<option value="">Selecione jogador</option>' +
        game.team2.players.map((player, index) =>
            `<option value="${index}">${player}</option>`
        ).join('');
}

function addQuickGoal(teamNumber) {
    const playerSelect = document.getElementById(`team${teamNumber}PlayerSelect`);
    const goalsInput = document.getElementById(`team${teamNumber}GoalsInput`);

    const playerIndex = parseInt(playerSelect.value);
    const goals = parseInt(goalsInput.value) || 0;

    if (playerSelect.value === '' || isNaN(playerIndex)) {
        alert('Selecione um jogador primeiro!');
        return;
    }

    if (goals <= 0) {
        alert('Digite um número de gols maior que zero!');
        return;
    }

    // Atualizar o input correspondente na ficha
    const inputId = `team${teamNumber}_player${playerIndex}`;
    const currentInput = document.getElementById(inputId);
    const currentValue = parseInt(currentInput.value) || 0;
    currentInput.value = currentValue + goals;

    // Atualizar totais
    updateGoals(teamNumber, playerIndex, currentInput.value);

    // Resetar seleção
    playerSelect.value = '';
    goalsInput.value = 0;

    // Salvar automaticamente após adicionar gol
    saveGameData();
}

function loadPlayers() {
    const game = games[currentGameIndex];
    const team1Container = document.getElementById('team1Players');
    const team2Container = document.getElementById('team2Players');

    team1Container.innerHTML = game.team1.players.map((player, index) => `
        <div class="player-row">
            <span class="player-name">- ${player}</span>
            <input type="number" min="0" value="0" id="team1_player${index}" 
                   onchange="updateGoals(1, ${index}, this.value)" class="goal-input">
        </div>
    `).join('');

    team2Container.innerHTML = game.team2.players.map((player, index) => `
        <div class="player-row">
            <span class="player-name">- ${player}</span>
            <input type="number" min="0" value="0" id="team2_player${index}" 
                   onchange="updateGoals(2, ${index}, this.value)" class="goal-input">
        </div>
    `).join('');
}

function updateGoals(teamNumber, playerIndex, goals) {
    const game = games[currentGameIndex];
    const goalCount = parseInt(goals) || 0;

    // Calcular total de gols do time
    let team1Total = 0;
    let team2Total = 0;

    game.team1.players.forEach((_, index) => {
        const input = document.getElementById(`team1_player${index}`);
        team1Total += parseInt(input.value) || 0;
    });

    game.team2.players.forEach((_, index) => {
        const input = document.getElementById(`team2_player${index}`);
        team2Total += parseInt(input.value) || 0;
    });

    // Atualizar display
    document.getElementById('team1Goals').textContent = team1Total;
    document.getElementById('team2Goals').textContent = team2Total;

    // Salvar no jogo
    game.goals1 = team1Total;
    game.goals2 = team2Total;

    // Salvar automaticamente
    saveGameData();
}

function finalizarJogo() {
    const game = games[currentGameIndex];

    // Parar o timer quando finalizar o jogo
    pauseTimer();

    // Calcular artilheiros
    game.team1.players.forEach((player, index) => {
        const goals = parseInt(document.getElementById(`team1_player${index}`).value) || 0;
        if (goals > 0) {
            scorers[player] = (scorers[player] || 0) + goals;
        }
    });

    game.team2.players.forEach((player, index) => {
        const goals = parseInt(document.getElementById(`team2_player${index}`).value) || 0;
        if (goals > 0) {
            scorers[player] = (scorers[player] || 0) + goals;
        }
    });

    // Determinar vencedor
    let winnerText;
    if (game.goals1 > game.goals2) {
        game.winner = game.team1.name;
        winnerText = `🟢 Vencedor: ${game.team1.name}`;
    } else if (game.goals2 > game.goals1) {
        game.winner = game.team2.name;
        winnerText = `🟢 Vencedor: ${game.team2.name}`;
    } else {
        game.winner = 'Empate';
        winnerText = `🟡 Empate`;
    }

    // Atualizar classificação
    updateStandingsForGame(game);

    game.finished = true;

    // SALVAR AUTOMATICAMENTE
    const saved = saveGameData();
    if (saved) {
        showNotification('🏁 Jogo finalizado e salvo!');
    }

    // Mostrar resultado
    document.getElementById('winnerText').textContent = winnerText;
    document.getElementById('winnerDisplay').style.display = 'block';
    document.getElementById('finishBtn').style.display = 'none';

    updateResults();
    updateStandings();
    updateChart();
}

function updateStandingsForGame(game) {
    const team1Stats = standings[game.team1.name];
    const team2Stats = standings[game.team2.name];

    team1Stats.games++;
    team2Stats.games++;
    team1Stats.goalsFor += game.goals1;
    team1Stats.goalsAgainst += game.goals2;
    team2Stats.goalsFor += game.goals2;
    team2Stats.goalsAgainst += game.goals1;

    if (game.goals1 > game.goals2) {
        team1Stats.wins++;
        team1Stats.points += 3;
        team2Stats.losses++;
    } else if (game.goals2 > game.goals1) {
        team2Stats.wins++;
        team2Stats.points += 3;
        team1Stats.losses++;
    } else {
        team1Stats.draws++;
        team2Stats.draws++;
        team1Stats.points += 1;
        team2Stats.points += 1;
    }
}

function proximoJogo() {
    currentGameIndex++;
    saveGameData();
    loadCurrentGame();
}

function showTournamentComplete() {
    document.getElementById('currentGame').innerHTML = `
        <div class="tournament-complete">
            <h2>🏆 Campeonato Finalizado!</h2>
            <p>Todos os 15 jogos foram concluídos.</p>
        </div>
    `;

    document.getElementById('gameSheet').innerHTML = `
        <div class="final-message">
            <h3>Parabéns a todos os participantes da Turma 4C!</h3>
            <p>Confira a classificação final e a artilharia abaixo.</p>
        </div>
    `;
}

function updateResults() {
    const tbody = document.getElementById('resultsTable');
    tbody.innerHTML = games.map((game, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${game.team1.name} × ${game.team2.name}</td>
            <td>${game.finished ? `${game.goals1} × ${game.goals2}` : '-'}</td>
            <td>${game.finished ? game.winner : '-'}</td>
        </tr>
    `).join('');
}

function updateStandings() {
    const tbody = document.getElementById('standingsTable');
    
    const sortedTeams = Object.entries(standings)
        .sort(([,a], [,b]) => {
            if (b.points !== a.points) return b.points - a.points;
            const saldoA = a.goalsFor - a.goalsAgainst;
            const saldoB = b.goalsFor - b.goalsAgainst;
            if (saldoB !== saldoA) return saldoB - saldoA;
            return b.goalsFor - a.goalsFor;
        });
    
    tbody.innerHTML = sortedTeams.map(([teamName, stats], index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${teamName}</td>
            <td>${stats.games}</td>
            <td>${stats.wins}</td>
            <td>${stats.draws}</td>
            <td>${stats.losses}</td>
            <td>${stats.goalsFor}</td>
            <td>${stats.goalsAgainst}</td>
            <td>${stats.goalsFor - stats.goalsAgainst}</td>
            <td><strong>${stats.points}</strong></td>
        </tr>
    `).join('');
}

function updateChart() {
    const container = document.getElementById('scorersChart').parentElement;
    
    if (Object.keys(scorers).length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: #666; font-size: 1.2rem;">
                🥅 Nenhum gol marcado ainda
            </div>
        `;
        return;
    }

    // Ordenar artilheiros por gols
    const sortedScorers = Object.entries(scorers)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8);

    container.innerHTML = `
        <div class="fifa-bracket">
            <div class="fifa-header">
                <h3>🏆 ARTILHARIA</h3>
                <p>CAMPEONATO DE FUTEBOL 2025 - TURMA 4C</p>
                <div class="fifa-logo">⚽</div>
            </div>
            
            <div class="bracket-structure">
                <div class="bracket-side left-side">
                    ${generateLeftBracket(sortedScorers.slice(0, 4))}
                </div>
                
                <div class="bracket-center">
                    <div class="center-title">ARTILHEIRO</div>
                    <div class="center-subtitle">CHUTEIRA DE OURO</div>
                    <div class="final-box">
                        ${sortedScorers.length > 0 ? `
                            <div class="champion-player">
                                <div class="champion-crown">👑</div>
                                <div class="champion-name">${sortedScorers[0][0]}</div>
                                <div class="champion-goals">${sortedScorers[0][1]} GOLS</div>
                                <div class="champion-ball">⚽</div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="center-logo">🥇</div>
                </div>
                
                <div class="bracket-side right-side">
                    ${generateRightBracket(sortedScorers.slice(4, 8))}
                </div>
            </div>
            
            <div class="full-ranking">
                <div class="ranking-title">🏅 RANKING COMPLETO</div>
                <div class="ranking-grid">
                    ${sortedScorers.map((scorer, index) => `
                        <div class="ranking-item ${index === 0 ? 'golden' : index < 3 ? 'podium' : ''}">
                            <div class="rank-position">${index + 1}°</div>
                            <div class="rank-name">${scorer[0]}</div>
                            <div class="rank-goals">${scorer[1]} gol${scorer[1] > 1 ? 's' : ''}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function generateLeftBracket(players) {
    return players.map((player, index) => `
        <div class="bracket-player left-player" style="animation-delay: ${index * 0.2}s">
            <div class="player-connector left-connector"></div>
            <div class="player-box">
                <div class="player-rank">${getPlayerRank(player[0])}</div>
                <div class="player-name">${player[0]}</div>
                <div class="player-goals">${player[1]}</div>
                <div class="player-ball">⚽</div>
            </div>
        </div>
    `).join('');
}

function generateRightBracket(players) {
    return players.map((player, index) => `
        <div class="bracket-player right-player" style="animation-delay: ${(index + 4) * 0.2}s">
            <div class="player-box">
                <div class="player-rank">${getPlayerRank(player[0])}</div>
                <div class="player-name">${player[0]}</div>
                <div class="player-goals">${player[1]}</div>
                <div class="player-ball">⚽</div>
            </div>
            <div class="player-connector right-connector"></div>
        </div>
    `).join('');
}

function getPlayerRank(playerName) {
    const sortedScorers = Object.entries(scorers).sort(([,a], [,b]) => b - a);
    const rank = sortedScorers.findIndex(([name]) => name === playerName) + 1;
    return rank;
}

function toggleTimer() {
    if (isTimerRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (timerInterval) return;
    
    isTimerRunning = true;
    document.getElementById('timerBtn').innerHTML = '⏸️ Pause';
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
pauseTimer();
            playWhistle();
            alert('⏱️ TEMPO ESGOTADO! Finalize o jogo.');
        }
    }, 1000);
}

function playWhistle() {
    const whistle = document.getElementById('whistleSound');
    if (whistle) {
        whistle.currentTime = 0;
        whistle.play().catch(error => {
            console.warn("Erro ao tentar tocar o som de apito:", error);
        });
    }
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    isTimerRunning = false;
    document.getElementById('timerBtn').innerHTML = '▶️ Play';
}

function resetTimer() {
    pauseTimer();
    timeRemaining = 600;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = display;
    
    const timerDisplay = document.getElementById('timerDisplay');
    if (timeRemaining <= 120) {
        timerDisplay.style.color = '#ff6b35';
    } else {
        timerDisplay.style.color = 'var(--accent-primary)';
    }
}

// Função para mostrar notificação
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent-primary);
        color: #000;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
    `;

    if (!document.getElementById('notification-style')) {
        const style = document.createElement('style');
        style.id = 'notification-style';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .save-btn {
                background: #28a745 !important;
                color: white !important;
                border: none !important;
                border-radius: 8px !important;
                padding: 0.75rem 1.5rem !important;
                font-size: 1rem !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                margin-right: 1rem !important;
            }
            .save-btn:hover {
                background: #218838 !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3) !important;
            }
            .main-controls {
                display: flex !important;
                gap: 1rem !important;
                justify-content: center !important;
                align-items: center !important;
                margin-top: 1rem !important;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Adicionar botão de reset
function addResetButton() {
    const resultsCards = document.querySelectorAll('.card h2');
    for (let header of resultsCards) {
        if (header.textContent.includes('📊 Resultados') && !header.querySelector('.reset-btn')) {
            const resetBtn = document.createElement('button');
            resetBtn.textContent = '🔄 Reset Campeonato';
            resetBtn.className = 'reset-btn';
            resetBtn.onclick = resetTournament;
            resetBtn.style.cssText = `
                margin-left: 1rem;
                background: var(--accent-secondary);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 0.5rem 1rem;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            `;

            resetBtn.addEventListener('mouseenter', function() {
                this.style.filter = 'brightness(1.2)';
                this.style.transform = 'translateY(-2px)';
            });

            resetBtn.addEventListener('mouseleave', function() {
                this.style.filter = 'brightness(1)';
                this.style.transform = 'translateY(0)';
            });

            header.appendChild(resetBtn);
            break;
        }
    }
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', init);

// Salvar quando a página for fechada
window.addEventListener('beforeunload', saveGameData);

// Salvar a cada 30 segundos (backup automático)
setInterval(saveGameData, 30000);
