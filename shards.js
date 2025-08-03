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
        .sort(([, a], [, b]) => b - a)
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