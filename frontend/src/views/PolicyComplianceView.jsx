import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function PolicyComplianceView() {
  const { currentPersona } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Policy Form State
  const [formData, setFormData] = useState({
    title: '',
    version: '1.0',
    summaryMarkdown: '',
    isMandatory: true,
  });
  const [formSuccess, setFormSuccess] = useState(null);

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/policies?employeeId=${currentPersona.id}`);
      setPolicies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [currentPersona.id]);

  const handleAcknowledge = async (policyId) => {
    try {
      await apiRequest(`/policies/${policyId}/acknowledge`, {
        method: 'POST',
        body: {
          employeeId: currentPersona.id,
        },
      });
      fetchPolicies();
    } catch (err) {
      alert(`Error acknowledging policy: ${err.message}`);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const [activeTab, setActiveTab] = useState('policies'); // 'policies' | 'publish'

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    setError(null);
    setFormSuccess(null);
    try {
      await apiRequest('/policies', {
        method: 'POST',
        body: formData,
      });
      setFormSuccess(`Published policy "${formData.title}" (v${formData.version})`);
      setFormData({
        title: '',
        version: '1.0',
        summaryMarkdown: '',
        isMandatory: true,
      });
      setActiveTab('policies');
      fetchPolicies();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePolicy = async (id, title) => {
    if (!window.confirm(`Delete policy "${title}"?`)) return;
    try {
      await apiRequest(`/policies/${id}`, { method: 'DELETE' });
      fetchPolicies();
    } catch (err) {
      alert(`Error deleting policy: ${err.message}`);
    }
  };

  const isAdmin = currentPersona.role === 'AdminHr';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Company Policies, Handbooks &amp; Compliance</h2>

        {/* Sub-tabs to eliminate vertical scrolling */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e1e4e8', marginTop: '14px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'policies' ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'policies' ? '2px solid #0366d6' : '2px solid transparent',
              color: activeTab === 'policies' ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            📜 Company Policies ({policies.length})
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('publish')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: activeTab === 'publish' ? 600 : 400,
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'publish' ? '2px solid #0366d6' : '2px solid transparent',
                color: activeTab === 'publish' ? '#0366d6' : '#586069',
                cursor: 'pointer'
              }}
            >
              ➕ Publish New Policy (Admin/HR)
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {formSuccess && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{formSuccess}</span>
            <button type="button" onClick={() => setFormSuccess(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#166534', fontWeight: 600 }}>✕</button>
          </div>
        )}

        {/* Tab 1: Policies List */}
        {activeTab === 'policies' && (
          <div>
            {loading && <p>Loading company policies...</p>}
            {error && <p><strong>Error:</strong> {error}</p>}

            {!loading && (
              <div>
                {policies.length === 0 ? (
                  <p>No policies published yet.</p>
                ) : (
                  policies.map((p) => {
                    const acknowledged = p.isAcknowledgedByCurrentEmployee;

                    return (
                      <fieldset key={p.id} style={{ marginBottom: '16px', background: '#ffffff' }}>
                        <legend>
                          <strong>{p.title} (Version {p.version})</strong>
                          {p.isMandatory && ' [Mandatory Policy]'}
                        </legend>

                        <p>
                          <strong>Published:</strong> {new Date(p.publishedAtUtc).toLocaleDateString()} |{' '}
                          <strong>Total Company Acknowledgements:</strong> {p.totalAcknowledgements}
                        </p>

                        <details open>
                          <summary><strong>Read Policy Summary</strong></summary>
                          <p style={{ whiteSpace: 'pre-line', marginTop: '8px' }}>{p.summaryMarkdown}</p>
                        </details>

                        <div style={{ marginTop: '12px' }}>
                          <strong>Your Compliance Status ({currentPersona.name}): </strong>
                          {acknowledged ? (
                            <span>
                              ✅ <strong>Acknowledged</strong> on{' '}
                              {p.acknowledgedAtUtc
                                ? new Date(p.acknowledgedAtUtc).toLocaleString()
                                : 'Recorded'}
                            </span>
                          ) : (
                            <span>
                              ⚠️ <strong>Pending Acknowledgement</strong>{' '}
                              <button
                                type="button"
                                onClick={() => handleAcknowledge(p.id)}
                                style={{ marginLeft: '8px' }}
                              >
                                I Have Read and Agree (Sign Read-Receipt)
                              </button>
                            </span>
                          )}
                        </div>

                        {isAdmin && (
                          <div style={{ marginTop: '10px' }}>
                            <button
                              type="button"
                              onClick={() => handleDeletePolicy(p.id, p.title)}
                              style={{ fontSize: '11px', color: '#cb2431' }}
                            >
                              Delete Policy Document
                            </button>
                          </div>
                        )}
                      </fieldset>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Publish Policy Form */}
        {activeTab === 'publish' && isAdmin && (
          <fieldset style={{ margin: 0 }}>
            <legend>Publish Company Document</legend>
            <form onSubmit={handleCreatePolicy} style={{ marginTop: '8px' }}>
              <p>
                <label htmlFor="policyTitle">Policy Title: </label>
                <br />
                <input
                  id="policyTitle"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Clean Desk & Confidentiality Policy"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={formData.title}
                  onChange={handleFormChange}
                />
              </p>

              <p>
                <label htmlFor="policyVersion">Version: </label>
                <br />
                <input
                  id="policyVersion"
                  name="version"
                  type="text"
                  required
                  placeholder="1.0"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={formData.version}
                  onChange={handleFormChange}
                />
              </p>

              <p>
                <label htmlFor="summaryMarkdown">Policy Content / Summary: </label>
                <br />
                <textarea
                  id="summaryMarkdown"
                  name="summaryMarkdown"
                  rows="6"
                  required
                  placeholder="Document the requirements, rules, and developer expectations..."
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={formData.summaryMarkdown}
                  onChange={handleFormChange}
                />
              </p>

              <p>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    name="isMandatory"
                    type="checkbox"
                    checked={formData.isMandatory}
                    onChange={handleFormChange}
                  />
                  <span>Mandatory acknowledgement for all outstaffed developers</span>
                </label>
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit">Publish Policy</button>
                <button type="button" onClick={() => setActiveTab('policies')}>Cancel</button>
              </div>
            </form>
          </fieldset>
        )}
      </div>
    </div>
  );
}
