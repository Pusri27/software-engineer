import { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, FileText } from "lucide-react";
import { WORKLOG_ENDPOINTS } from "../../config/api";
import "./WorklogSummary.css";

const WorklogSummary = ({ worklogs = [] }) => {
  const [summary, setSummary] = useState("");
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Strip HTML tags and base64 from content
  const cleanContent = (html) => {
    if (!html) return "";
    return html
      .replace(/data:[^;]+;base64,[A-Za-z0-9+/=]+/g, "") // remove base64
      .replace(/<[^>]*>/g, " ")                            // remove HTML tags
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 250);
  };

  const fetchSummary = useCallback(async (logs) => {
    const source = logs && logs.length > 0 ? logs : worklogs;
    if (source.length === 0) {
      setSummary("");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("token");

      // Build a lightweight payload from the worklogs already on screen
      const payload = source.map((log) => ({
        title: log.title || "",
        tag: log.tag || [],
        content: cleanContent(log.content || ""),
        author: log.user?.name || "",
        date: log.datetime || log.createdAt || "",
      }));

      const response = await fetch(WORKLOG_ENDPOINTS.SUMMARIZE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ worklogs: payload }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to fetch summary");
      }

      const data = await response.json();
      setSummary(data.summary || "");
      setTotalLogs(data.totalLogs || source.length);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [worklogs]);

  // Auto-fetch whenever worklogs change (new page, filter, etc.)
  useEffect(() => {
    if (worklogs.length > 0) {
      fetchSummary(worklogs);
    }
  }, [worklogs]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="ws-container">
      {/* Header */}
      <div className="ws-header">
        <div className="ws-header-left">
          <div className="ws-icon-wrapper">
            <Sparkles size={14} />
          </div>
          <span className="ws-title">Team Summary</span>
        </div>
        <button
          className={`ws-refresh-btn ${loading ? "ws-refresh-spinning" : ""}`}
          onClick={() => fetchSummary(worklogs)}
          disabled={loading}
          title="Refresh summary"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="ws-body">
        {loading ? (
          <div className="ws-loading">
            <div className="ws-shimmer" />
            <div className="ws-shimmer ws-shimmer-short" />
            <div className="ws-shimmer" />
            <div className="ws-shimmer ws-shimmer-medium" />
            <p className="ws-loading-label">AI is analyzing...</p>
          </div>
        ) : error ? (
          <div className="ws-error">
            <p>{error}</p>
            <button className="ws-retry-btn" onClick={() => fetchSummary(worklogs)}>
              Try again
            </button>
          </div>
        ) : summary ? (
          <>
            <p className="ws-summary-text">{summary}</p>
            <div className="ws-footer">
              <div className="ws-meta">
                <FileText size={11} />
                <span>{totalLogs} worklog{totalLogs !== 1 ? 's' : ''} analyzed</span>
              </div>
              {lastUpdated && (
                <span className="ws-timestamp">{formatTime(lastUpdated)}</span>
              )}
            </div>
          </>
        ) : worklogs.length === 0 ? (
          <p className="ws-empty">Loading worklogs...</p>
        ) : (
          <p className="ws-empty">No worklogs available to summarize.</p>
        )}
      </div>
    </div>
  );
};

export default WorklogSummary;
