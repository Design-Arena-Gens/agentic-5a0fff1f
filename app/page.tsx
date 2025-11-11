/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { PLATFORMS, type PlatformId, type SearchResponse } from '@/lib/platforms';

type HistoryEntry = {
  query: string;
  timestamp: string;
  platforms: PlatformId[];
  summary: SearchResponse['meta'];
};

const STORAGE_KEY = 'niche-signal-scout-history';

export default function HomePage() {
  const [query, setQuery] = useState('climate-positive fintech for Gen Z investors');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(
    PLATFORMS.map((item) => item.id)
  );
  const [data, setData] = useState<SearchResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as HistoryEntry[];
      setHistory(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 8)));
  }, [history]);

  const togglePlatform = useCallback(
    (platform: PlatformId) => {
      setSelectedPlatforms((current) =>
        current.includes(platform)
          ? current.filter((item) => item !== platform)
          : [...current, platform]
      );
    },
    [setSelectedPlatforms]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!query.trim()) {
        setError('Enter a topic to scout for signals.');
        return;
      }
      if (!selectedPlatforms.length) {
        setError('Select at least one platform.');
        return;
      }
      setError(null);
      setLoading(true);

      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query.trim(), platforms: selectedPlatforms })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? 'Agent failed to scout signals.');
        }

        const payload = (await response.json()) as SearchResponse;
        setData(payload);
        setHistory((prev) => [
          {
            query: payload.meta.query,
            timestamp: payload.meta.generatedAt,
            platforms: payload.meta.platforms,
            summary: payload.meta
          },
          ...prev.filter((item) => item.query !== payload.meta.query)
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected failure.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [query, selectedPlatforms]
  );

  const reuseSearch = useCallback((entry: HistoryEntry) => {
    setQuery(entry.query);
    setSelectedPlatforms(entry.platforms);
  }, []);

  const engagementScore = useMemo(() => {
    if (!data) return 0;
    if (!data.results.length) return 0;
    const total = data.results.reduce((sum, item) => sum + item.score, 0);
    return Math.round((total / data.results.length) * 10) / 10;
  }, [data]);

  return (
    <main className="page">
      <header className="hero">
        <div>
          <span className="pill">Agentic Social Intel</span>
          <h1>
            Scout niche conversations with <span className="accent">signal-first research</span>
          </h1>
          <p>
            Launch an autonomous agent that combs Reddit, Hacker News, and Dev.to for emergent chatter.
            Surface deep community threads, rank engagement, and get action-ready follow-up prompts.
          </p>
        </div>
        <img src="/agent-orbit.svg" alt="Signal scout illustration" className="hero-visual" />
      </header>

      <section className="card">
        <form className="form" onSubmit={handleSubmit}>
          <label className="label" htmlFor="query">
            Niche or thesis to investigate
          </label>
          <div className="query-row">
            <input
              id="query"
              name="query"
              value={query}
              placeholder="e.g. ai agents for mental health coaching"
              onChange={(event) => setQuery(event.target.value)}
              className="input"
              disabled={loading}
            />
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Scanning...' : 'Run scout'}
            </button>
          </div>

          <fieldset className="platforms">
            <legend>Platforms</legend>
            {PLATFORMS.map((platform) => (
              <label key={platform.id} className="platform-option">
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platform.id)}
                  onChange={() => togglePlatform(platform.id)}
                  disabled={loading}
                />
                <span>
                  <strong>{platform.label}</strong>
                  <small>{platform.highlight}</small>
                </span>
              </label>
            ))}
          </fieldset>
        </form>

        {error && <div className="error">{error}</div>}
      </section>

      {data && (
        <section className="results">
          <div className="results-header">
            <div>
              <h2>Top signals</h2>
              <p>
                {data.results.length
                  ? `Agent collected ${data.results.length} conversations across ${data.meta.platforms.length} platforms.`
                  : 'No active conversations matched this niche. Try a different angle.'}
              </p>
            </div>
            <div className="score">
              <span>Avg. engagement</span>
              <strong>{engagementScore}</strong>
            </div>
          </div>

          <div className="result-grid">
            {data.results.map((item) => (
              <article key={item.id} className={`result-card platform-${item.platform}`}>
                <header>
                  <span className="badge">{item.platform}</span>
                  <h3>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.title}
                    </a>
                  </h3>
                </header>
                <p>{item.excerpt}</p>
                <dl className="meta">
                  {item.author && (
                    <>
                      <dt>Author</dt>
                      <dd>{item.author}</dd>
                    </>
                  )}
                  {item.metadata?.comments !== undefined && (
                    <>
                      <dt>Comments</dt>
                      <dd>{item.metadata.comments as number}</dd>
                    </>
                  )}
                  {item.metadata?.upvotes !== undefined && (
                    <>
                      <dt>Upvotes</dt>
                      <dd>{item.metadata.upvotes as number}</dd>
                    </>
                  )}
                  {item.metadata?.points !== undefined && (
                    <>
                      <dt>Points</dt>
                      <dd>{item.metadata.points as number}</dd>
                    </>
                  )}
                  {item.metadata?.reactions !== undefined && (
                    <>
                      <dt>Reactions</dt>
                      <dd>{item.metadata.reactions as number}</dd>
                    </>
                  )}
                  <dt>Signal score</dt>
                  <dd>{item.score}</dd>
                </dl>
              </article>
            ))}
          </div>

          <div className="angles">
            <div>
              <h3>Angles to pursue</h3>
              <ul>
                {data.meta.recommendedAngles.map((angle) => (
                  <li key={angle}>{angle}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Follow-up prompts</h3>
              <ul>
                {data.meta.nextPrompts.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="history">
        <div className="history-header">
          <h2>Recent scouting runs</h2>
          <p>Tap to rehydrate a previous mission with fresh data.</p>
        </div>
        <div className="history-grid">
          {history.length === 0 && <p className="muted">No past runs yet. Your missions log will appear here.</p>}
          {history.map((entry) => (
            <button
              type="button"
              key={`${entry.query}-${entry.timestamp}`}
              className="history-card"
              onClick={() => reuseSearch(entry)}
            >
              <span className="history-query">{entry.query}</span>
              <span className="history-meta">
                {new Intl.DateTimeFormat('en', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                }).format(new Date(entry.timestamp))}
              </span>
              <span className="history-platforms">
                {entry.platforms.map((platform) => (
                  <span key={platform} className={`tag platform-${platform}`}>
                    {platform}
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>
      </section>

      <style jsx>{`
        .page {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .hero {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          align-items: center;
        }

        .hero h1 {
          font-size: clamp(2.4rem, 7vw, 3.6rem);
          line-height: 1.1;
          margin-bottom: 1rem;
        }

        .hero p {
          margin: 0;
          line-height: 1.7;
          color: rgba(226, 232, 240, 0.85);
        }

        .accent {
          color: #38bdf8;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.8rem;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.2);
          color: rgba(226, 232, 240, 0.9);
          font-size: 0.85rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }

        .hero-visual {
          max-width: 320px;
          justify-self: center;
        }

        .card {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 1.5rem;
          padding: 2rem;
          box-shadow: 0 10px 40px rgba(15, 23, 42, 0.3);
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .label {
          font-weight: 600;
          font-size: 0.95rem;
          color: rgba(226, 232, 240, 0.9);
        }

        .query-row {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 700px) {
          .query-row {
            flex-direction: row;
            align-items: center;
          }
        }

        .input {
          flex: 1;
          padding: 0.85rem 1.1rem;
          border-radius: 0.9rem;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(15, 23, 42, 0.6);
          color: #e2e8f0;
          transition: border 0.2s ease;
        }

        .input:focus {
          outline: none;
          border-color: rgba(56, 189, 248, 0.9);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
        }

        .primary {
          border: none;
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          color: white;
          padding: 0.85rem 1.6rem;
          border-radius: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(99, 102, 241, 0.25);
        }

        .primary:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .platforms {
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 1rem;
          padding: 1.25rem;
          display: grid;
          gap: 1rem;
        }

        .platforms legend {
          font-weight: 600;
          padding: 0 0.5rem;
        }

        .platform-option {
          display: flex;
          gap: 0.8rem;
          align-items: flex-start;
          padding: 0.9rem;
          border-radius: 0.8rem;
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid transparent;
          cursor: pointer;
        }

        .platform-option input {
          margin-top: 0.4rem;
        }

        .platform-option strong {
          display: block;
          color: #f8fafc;
        }

        .platform-option small {
          color: rgba(148, 163, 184, 0.85);
        }

        .error {
          margin-top: 1rem;
          padding: 0.85rem 1rem;
          border-radius: 0.8rem;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fecaca;
        }

        .results {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .results-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 720px) {
          .results-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .score {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          background: rgba(56, 189, 248, 0.15);
          border-radius: 1rem;
          padding: 1rem 1.2rem;
          border: 1px solid rgba(56, 189, 248, 0.35);
        }

        .score span {
          font-size: 0.85rem;
          color: rgba(226, 232, 240, 0.85);
        }

        .score strong {
          font-size: 1.8rem;
        }

        .result-grid {
          display: grid;
          gap: 1.4rem;
        }

        @media (min-width: 900px) {
          .result-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .result-card {
          padding: 1.4rem;
          border-radius: 1.2rem;
          border: 1px solid rgba(148, 163, 184, 0.15);
          background: rgba(15, 23, 42, 0.85);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: 220px;
        }

        .result-card header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .result-card h3 {
          margin: 0;
          font-size: 1.05rem;
        }

        .result-card p {
          color: rgba(226, 232, 240, 0.8);
          margin: 0;
          line-height: 1.6;
        }

        .badge {
          padding: 0.35rem 0.7rem;
          border-radius: 0.7rem;
          font-size: 0.75rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(15, 23, 42, 0.88);
          background: rgba(148, 163, 184, 0.85);
        }

        .meta {
          margin: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 0.6rem 1.2rem;
        }

        .meta dt {
          font-size: 0.7rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: rgba(148, 163, 184, 0.7);
        }

        .meta dd {
          margin: 0;
          font-weight: 600;
        }

        .angles {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        }

        .angles ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.9rem;
        }

        .angles li {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 0.9rem;
          padding: 1rem 1.1rem;
          line-height: 1.5;
          color: rgba(226, 232, 240, 0.9);
        }

        .history {
          background: rgba(15, 23, 42, 0.75);
          border-radius: 1.5rem;
          padding: 2rem;
          border: 1px solid rgba(148, 163, 184, 0.1);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .history-grid {
          display: grid;
          gap: 1rem;
        }

        @media (min-width: 900px) {
          .history-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .history-card {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          align-items: flex-start;
          background: rgba(30, 41, 59, 0.72);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 1rem;
          padding: 1.1rem 1.2rem;
          cursor: pointer;
          transition: transform 0.18s ease, border 0.18s ease;
          color: inherit;
          text-align: left;
        }

        .history-card:hover {
          transform: translateY(-1px);
          border-color: rgba(56, 189, 248, 0.4);
        }

        .history-query {
          font-weight: 600;
          color: #f8fafc;
        }

        .history-meta {
          font-size: 0.8rem;
          color: rgba(148, 163, 184, 0.7);
        }

        .history-platforms {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .tag {
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .muted {
          color: rgba(148, 163, 184, 0.75);
        }

        .platform-reddit {
          background: linear-gradient(135deg, rgba(255, 69, 0, 0.2), rgba(255, 69, 0, 0.05));
          border-color: rgba(255, 132, 53, 0.3);
        }

        .platform-hackernews {
          background: linear-gradient(135deg, rgba(255, 140, 0, 0.2), rgba(255, 140, 0, 0.05));
          border-color: rgba(255, 191, 94, 0.3);
        }

        .platform-devto {
          background: linear-gradient(135deg, rgba(45, 212, 191, 0.2), rgba(45, 212, 191, 0.05));
          border-color: rgba(45, 212, 191, 0.3);
        }
      `}</style>
    </main>
  );
}
