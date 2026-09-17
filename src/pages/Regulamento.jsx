import React from 'react'
import { Link } from 'react-router-dom'

const pilares = [
  { nome: 'Organização', limite: 100, itens: [['Zeladoria', 50], ['Cuidado com o patrimônio', 50]] },
  { nome: 'Disciplina', limite: 150, itens: [['Pontualidade', 20], ['Mapeamento', null], ['Uso do uniforme', 10], ['Comportamento', 50], ['Assiduidade', 20], ['Uso de aparelhos eletrônicos', null]] },
  { nome: 'Realização de Atividades', limite: 150, itens: [['Deveres de casa', 50], ['Trabalhos em grupo', 50], ['Participação em eventos', 50]] },
  { nome: 'Relacionamento entre Estudantes', limite: 150, itens: [['Acolhimento de todos os colegas', 50], ['Ausência de conflitos graves ou bullying', 50], ['Solidariedade com os colegas', 50]] },
  { nome: 'Relacionamento com Professor', limite: 150, itens: [['Respeito aos professores', 50], ['Cordialidade com os professores', 50], ['Colaboração com os professores', 50]] },
  { nome: 'Notas nas Avaliações', limite: 300, itens: [['Média da turma', 100], ['Evolução', 100], ['Recuperação', 100]] }
]

const penalidades = [
  ['Depredar, quebrar, riscar bens físicos ou móveis', '-50 pontos'],
  ['Ficar fora da sala de aula injustificadamente', '-2/dia, -10/semana, -60/período'],
  ['Advertências, ocorrências ou suspensões', '-150 pontos'],
  ['Desrespeito grave, brigas, vandalismo ou preconceito', '-150 pontos'],
  ['Inadimplência na entrega de atividades', '-10 cada, limite -100'],
  ['Tentar burlar regras ou colar', '-100 pontos'],
  ['Uso indevido de aparelhos eletrônicos', '-20 pontos']
]

export default function Regulamento() {
  return (
    <div className="public-page">
      <header className="public-hero">
        <Link to="/login" className="btn btn-primary">← Voltar ao login</Link>
        <div className="public-hero-content">
          <span className="hero-logo">🏆</span>
          <h1>Regulamento da Competição Interclasses</h1>
          <p>Trofeu "Classe Ouro" — Sistema de Competição entre Turmas Escolares</p>
        </div>
      </header>

      <main className="regulamento-content">
        <section className="reg-section">
          <h2>🎯 Objetivo</h2>
          <p>
            Promover o desenvolvimento de valores como organização, disciplina, responsabilidade,
            solidariedade e desempenho acadêmico entre as turmas, através de uma competição saudável.
            A turma que acumular a maior pontuação ao final do período letivo será a vencedora.
          </p>
        </section>

        <section className="reg-section">
          <h2>👥 Participantes</h2>
          <p>
            Todas as turmas da escola participam da competição. A pontuação pertence à turma como um todo,
            e não a alunos individuais.
          </p>
        </section>

        <section className="reg-section">
          <h2>📊 Critérios de Pontuação</h2>
          <p>A pontuação é dividida em seis pilares. Confira os valores máximos por período:</p>
          <div className="reg-table-wrap">
            <table className="reg-table">
              <thead>
                <tr><th>Pilar</th><th>Limite por período</th></tr>
              </thead>
              <tbody>
                {pilares.map((p) => (
                  <tr key={p.nome}><td>{p.nome}</td><td>{p.limite} pontos</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="reg-section">
          <h2>📋 Tabela Oficial de Pontuação (Anexo 1)</h2>
          <div className="reg-table-wrap">
            <table className="reg-table">
              <thead><tr><th>Critério</th><th>Pontos</th></tr></thead>
              <tbody>
                {pilares.flatMap((p) => p.itens.map(([criterio, pts]) => (
                  <tr key={criterio}><td>{criterio} <small className="reg-cat">({p.nome})</small></td><td>{pts ?? '—'}</td></tr>
                )))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="reg-section">
          <h2>⚠️ Penalidades</h2>
          <div className="reg-table-wrap">
            <table className="reg-table">
              <thead><tr><th>Infração</th><th>Pontos</th></tr></thead>
              <tbody>
                {penalidades.map(([inf, pts]) => (
                  <tr key={inf}><td>{inf}</td><td>{pts}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="reg-section">
          <h2>🧑‍🏫 Comissão Avaliadora</h2>
          <p>
            A competição é avaliada pelos professores e pela comissão organizadora da escola,
            que registram as pontuações e aplicam as penalidades conforme este regulamento.
            Todas as ações ficam registradas no histórico com identificação do responsável.
          </p>
        </section>

        <section className="reg-section">
          <h2>🏆 Premiação</h2>
          <p>
            A turma que acumular a <strong>maior pontuação ao final do período letivo</strong> receberá:
          </p>
          <ul className="reg-list">
            <li>🏆 Troféu "Classe Ouro"</li>
            <li>🍕 Recompensa coletiva: uma rodada de pizza</li>
          </ul>
        </section>
      </main>

      <footer className="public-footer">
        <p>© {new Date().getFullYear()} Classe Ouro — Sistema de Competição Interclasses</p>
      </footer>
    </div>
  )
}
