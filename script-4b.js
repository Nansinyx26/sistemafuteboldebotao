const teams = [
    { name: "Cinco Estrelas", players: ["Nicolas F.", "Bryan", "Emanuélly", "Nicolas D."] },
    { name: "Tung Tung Tung Tung SahuR", players: ["Miguel", "Pedro", "Antônio", "Luan"] },
    { name: "Girl dos Rosas", players: ["Ana Laura", "Maria Fernanda", "Enzo H.", "Isabela"] },
    { name: "Winx of The King of The Power da Quebrada", players: ["Alice", "Lorena", "Júlia G.", "Melyssa"] },
    { name: "Harry Potter - Alunas de Hogwarts", players: ["Valentina", "Lívia", "Beatriz", "Júlia M."] },
    { name: "Caça-Rato", players: ["Enzo P.", "Eliel", "Gabriel", "Lorenzo"] },
    { name: "Sem Nome", players: ["Issis", "Enzo Santa Rosa", "Maria Eliza", "Gabriel F."] }
];

const gamesList = [
    { team1: 0, team2: 1 }, // Cinco Estrelas × Tung Tung Tung Tung SahuR
    { team1: 0, team2: 2 }, // Cinco Estrelas × Girl dos Rosas
    { team1: 0, team2: 3 }, // Cinco Estrelas × Winx of The King of The Power da Quebrada
    { team1: 0, team2: 4 }, // Cinco Estrelas × Harry Potter - Alunas de Hogwarts
    { team1: 0, team2: 5 }, // Cinco Estrelas × Caça-Rato
    { team1: 0, team2: 6 }, // Cinco Estrelas × Sem Nome
    { team1: 1, team2: 2 }, // Tung Tung Tung Tung SahuR × Girl dos Rosas
    { team1: 1, team2: 3 }, // Tung Tung Tung Tung SahuR × Winx of The King of The Power da Quebrada
    { team1: 1, team2: 4 }, // Tung Tung Tung Tung SahuR × Harry Potter - Alunas de Hogwarts
    { team1: 1, team2: 5 }, // Tung Tung Tung Tung SahuR × Caça-Rato
    { team1: 1, team2: 6 }, // Tung Tung Tung Tung SahuR × Sem Nome
    { team1: 2, team2: 3 }, // Girl dos Rosas × Winx of The King of The Power da Quebrada
    { team1: 2, team2: 4 }, // Girl dos Rosas × Harry Potter - Alunas de Hogwarts
    { team1: 2, team2: 5 }, // Girl dos Rosas × Caça-Rato
    { team1: 2, team2: 6 }, // Girl dos Rosas × Sem Nome
    { team1: 3, team2: 4 }, // Winx of The King of The Power da Quebrada × Harry Potter - Alunas de Hogwarts
    { team1: 3, team2: 5 }, // Winx of The King of The Power da Quebrada × Caça-Rato
    { team1: 3, team2: 6 }, // Winx of The King of The Power da Quebrada × Sem Nome
    { team1: 4, team2: 5 }, // Harry Potter - Alunas de Hogwarts × Caça-Rato
    { team1: 4, team2: 6 }, // Harry Potter - Alunas de Hogwarts × Sem Nome
    { team1: 5, team2: 6 } // Caça-Rato × Sem Nome
];

// Estado do jogo
let currentGameIndex = 0;
let games = [];
let scorers = {};
let chart = null;
let standings = {};
let timerInterval = null;
let timeRemaining = 600;
let isTimerRunning = false;

// FUNÇÕES DE SALVAMENTO
function saveGameData() {
    const gameData = {
        games,
        scorers,
        standings,
        currentGameIndex,
        timestamp: Date.now()
    };
    localStorage.setItem('soccerTournament_4B', JSON.stringify(gameData));
}

function loadGameData() {
    const savedData = localStorage.getItem('soccerTournament_4B');
    if (savedData) {
        try {
            const gameData = JSON.parse(savedData);

            if (gameData.games && gameData.scorers && gameData.standings) {
                games = gameData.games;
                scorers = gameData.scorers;
                standings = gameData.standings;
                currentGameIndex = gameData.currentGameIndex || 0;

                console.log('Dados carregados do localStorage');
                return true;
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            localStorage.removeItem('soccerTournament_4B');
        }
    }
    return false;
}

function resetTournament() {
    if (confirm('⚠️ Tem certeza que deseja resetar todo o campeonato?\n\nTodos os jogos, gols e classificações serão perdidos!')) {
        localStorage.removeItem('soccerTournament_4B');
        currentGameIndex = 0;
        scorers = {};

        initializeGames();
        initializeStandings();
        loadCurrentGame();
        updateResults();
        updateStandings();
        updateChart();

        showNotification('🔄 Campeonato resetado com sucesso!');
    }
}

// Inicialização
function init() {
    const dataLoaded = loadGameData();

    if (!dataLoaded) {
        initializeGames();
        initializeStandings();
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
            showNotification(`✅ ${finishedGames} jogos carregados`);
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
    loadCurrentGame();
}

function showTournamentComplete() {
    document.getElementById('currentGame').innerHTML = `
        <div class="tournament-complete">
            <h2>🏆 Campeonato Finalizado!</h2>
            <p>Todos os 21 jogos foram concluídos.</p>
        </div>
    `;

    document.getElementById('gameSheet').innerHTML = `
        <div class="final-message">
            <h3>Parabéns a todos os participantes!</h3>
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

// NOVA FUNÇÃO - Chaveamento FIFA
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
        .slice(0, 8); // Top 8 artilheiros

    // Criar estrutura de chaveamento estilo FIFA
    container.innerHTML = `
        <div class="fifa-bracket">
            <div class="fifa-header">
                <h3>🏆 ARTILHARIA</h3>
                <p>CAMPEONATO DE FUTEBOL 2025</p>
                <div class="fifa-logo">⚽</div>
            </div>
            
            <div class="bracket-structure">
                <!-- Lado Esquerdo -->
                <div class="bracket-side left-side">
                    ${generateLeftBracket(sortedScorers.slice(0, 4))}
                </div>
                
                <!-- Centro - Final -->
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
                
                <!-- Lado Direito -->
                <div class="bracket-side right-side">
                    ${generateRightBracket(sortedScorers.slice(4, 8))}
                </div>
            </div>
            
            <!-- Ranking completo embaixo -->
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

function renderGameBracket() {
    const container = document.getElementById('gamesBracket');
    
    if (!container) return;

    const finishedGames = games.filter(game => game.finished);

    if (finishedGames.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 2rem;">⚠️ Nenhum jogo finalizado ainda</div>`;
        return;
    }

    container.innerHTML = `
        <div class="fifa-bracket">
            <div class="fifa-header">
                <h3>🎮 HISTÓRICO DE JOGOS</h3>
                <p>Resultados do Campeonato</p>
                <div class="fifa-logo">📅</div>
            </div>
            <div class="bracket-structure">
                <div class="bracket-side left-side">
                    ${finishedGames.slice(0, Math.ceil(finishedGames.length / 2)).map(renderGameBox).join('')}
                </div>
                <div class="bracket-side right-side">
                    ${finishedGames.slice(Math.ceil(finishedGames.length / 2)).map(renderGameBox).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderGameBox(game, index) {
    return `
        <div class="bracket-player" style="animation-delay: ${index * 0.15}s">
            <div class="player-box">
                <div class="player-name">${game.team1.name} ${game.goals1} × ${game.goals2} ${game.team2.name}</div>
                <div class="player-goals">${game.winner === 'Empate' ? '🤝 Empate' : '🏆 ' + game.winner}</div>
            </div>
        </div>
    `;
}

// NOVA FUNÇÃO - Lado Esquerdo do Chaveamento
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

// NOVA FUNÇÃO - Lado Direito do Chaveamento
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

// NOVA FUNÇÃO - Obter Posição do Jogador
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
    timeRemaining = 600; // 10 minutos
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = display;
    
    // Mudar cor quando restam menos de 2 minutos
    const timerDisplay = document.getElementById('timerDisplay');
    if (timeRemaining <= 120) {
        timerDisplay.style.color = '#ff6b35';
    } else {
        timerDisplay.style.color = 'var(--accent-primary)';
    }
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', init);
