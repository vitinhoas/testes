window.onload = function () {
    fetch('http://localhost:3000/data')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar dados: ' + response.statusText);
            }
            return response.text();
        })
        .then(text => {
            const rows = text.split('\n').filter(row => row.trim() !== ''); // Remove linhas vazias
            const tbody = document.querySelector('#tabela tbody');
            tbody.innerHTML = '';

            rows.forEach((row, rowIndex) => {
                const cols = row.split(',').map(col => col.trim()); // Remove espaços em branco nas colunas
                const tr = document.createElement('tr'); // Cria uma nova linha

                cols.forEach(col => {
                    const td = document.createElement('td');
                    col = col.trim(); // Remove espaços em branco
                    td.textContent = col; // Define o conteúdo da célula

                    // Verifica o conteúdo da célula para aplicar a cor diretamente via JavaScript
                    if (col === '') {
                        td.style.backgroundColor = '#FFFFFF'; // Célula vazia
                    } else if (col === 'OFF-R') {
                        td.style.backgroundColor = '#808080'; // cor do bloco
                        td.style.color = 'YELLOW'; // cor do texto
                    } else if (col === 'OFF') {
                        td.style.backgroundColor = '#DCDCDC'; // cor do bloco
                        td.style.color = 'black'; // cor do texto
                    } else if (col === '06:30 15:00') {
                        td.style.backgroundColor = '#87CEFA'; // cor do bloco
                        td.style.color = 'BLACK'; // cor do texto
                    } else if (col === '15:00 23:30') {
                        td.style.backgroundColor = '#F5DEB3'; // cor do bloco
                        td.style.color = 'BLACK'; // cor do texto
                    } else if (col === '05:30 14:00') {
                        td.style.backgroundColor = '#3CB371'; // cor do bloco
                        td.style.color = 'BLACK'; // cor do texto
                    } else if (col === 'H') {
                        td.style.backgroundColor = '#C71585'; // cor do bloco
                        td.style.color = 'white'; // cor do texto
                    } else {
                        td.style.backgroundColor = '#fff'; // Outras células: cor branca (ou outra cor)
                    }

                    tr.appendChild(td); // Adiciona a célula à linha
                });

                // Adiciona a linha à tabela
                tbody.appendChild(tr);
            });

            // Se não houver linhas, exibe uma mensagem de dados ausentes
            if (tbody.children.length === 0) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = cols.length; // Colspan para a célula
                td.textContent = 'Nenhum dado disponível.';
                tr.appendChild(td);
                tbody.appendChild(tr);
            }
        })
        .catch(err => {
            console.error(err);
            const tbody = document.querySelector('#tabela tbody');
            tbody.innerHTML = '<tr><td colspan="5">Erro ao carregar os dados.</td></tr>'; // Exibir mensagem de erro
        });
};
