import { useState, useEffect } from 'react'
import api from '../api'
import { Search, Filter, BookOpen, Code2, Users, Brain } from 'lucide-react'

const CATEGORY_ICONS = { 'Data Structures': Code2, 'Algorithms': Brain, 'Behavioral': Users, default: BookOpen }

export default function QuestionBank() {
  const [questions, setQuestions] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get('/questions').then(r => {
      setQuestions(r.data.questions)
      setFiltered(r.data.questions)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let res = questions
    if (search) res = res.filter(q => q.question.toLowerCase().includes(search.toLowerCase()) || q.category.toLowerCase().includes(search.toLowerCase()))
    if (catFilter) res = res.filter(q => q.category === catFilter)
    if (diffFilter) res = res.filter(q => q.difficulty === diffFilter)
    setFiltered(res)
  }, [search, catFilter, diffFilter, questions])

  const categories = [...new Set(questions.map(q => q.category))]

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="spinner spinner-lg" />
    </div>
  )

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h2>Question Bank</h2>
        <p>Browse and study interview questions by category and difficulty</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="input-with-icon" style={{ flex: 1, minWidth: 200 }}>
          <Search size={14} className="input-icon" />
          <input className="input" placeholder="Search questions..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input" style={{ width: 160 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="input" style={{ width: 130 }} value={diffFilter} onChange={e => setDiffFilter(e.target.value)}>
          <option value="">All Levels</option>
          <option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
      </div>

      <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
        Showing {filtered.length} of {questions.length} questions
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={28} color="var(--text-muted)" /></div>
            <h3>No questions found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : filtered.map(q => {
          const Icon = CATEGORY_ICONS[q.category] || CATEGORY_ICONS.default
          return (
            <div key={q.id} className="qb-item" onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
              <div className="qb-item-header">
                <div className="qb-item-icon" style={{ background: 'var(--accent-subtle)' }}>
                  <Icon size={14} color="var(--accent)" />
                </div>
                <span className="qb-question">{q.question}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <span className="badge badge-muted">{q.category}</span>
                  <span className={`badge badge-${q.difficulty === 'Easy' ? 'success' : q.difficulty === 'Hard' ? 'danger' : 'warning'}`}>
                    {q.difficulty}
                  </span>
                  <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{q.type}</span>
                </div>
              </div>
              {expanded === q.id && (
                <div className="qb-item-body fade-in">
                  <div className="qb-hint">
                    💡 Think about real-world examples, edge cases, and trade-offs when answering this question.
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        .qb-item { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 14px 18px; cursor: pointer; transition: all var(--transition); }
        .qb-item:hover { border-color: rgba(108,99,255,0.3); }
        .qb-item-header { display: flex; align-items: center; gap: 12px; }
        .qb-item-icon { width: 30px; height: 30px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .qb-question { flex: 1; font-size: 14px; font-weight: 500; line-height: 1.4; }
        .qb-item-body { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
        .qb-hint { background: var(--bg-elevated); border-radius: var(--radius); padding: 12px 14px; font-size: 13px; color: var(--text-secondary); line-height: 1.5; border-left: 3px solid var(--accent); }
      `}</style>
    </div>
  )
}
