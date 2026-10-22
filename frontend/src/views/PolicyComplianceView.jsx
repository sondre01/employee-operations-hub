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
    <section>
      <h2>Company Policies, Handbooks & Compliance Read-Receipts</h2>
      <p>
        Ensures outstaffed developers comply with Nordic client GDPR requirements, hardware custody
        guidelines, and Philippine labor standards.
      </p>

      {loading && <p>Loading company policies...</p>}
      {error && <p><strong>Error:</strong> {error}</p>}

      {/* Policies List */}
      {!loading && (
        <div>
          {policies.length === 0 ? (
            <p>No policies published yet.</p>
          ) : (
            policies.map((p) => {
              const acknowledged = p.isAcknowledgedByCurrentEmployee;

              return (
                <fieldset key={p.id} style={{ marginBottom: '16px' }}>
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
                    <p style={{ whiteSpace: 'pre-line' }}>{p.summaryMarkdown}</p>
                  </details>

                  <br />

                  <div>
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
                        >
                          I Have Read and Agree (Sign Read-Receipt)
                        </button>
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleDeletePolicy(p.id, p.title)}
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

      {/* Author New Policy for Admin/HR */}
      {isAdmin && (
        <>
          <br />
          <details>
            <summary><strong>+ Author & Publish New Policy (Admin/HR Only)</strong></summary>
            <form onSubmit={handleCreatePolicy}>
              <fieldset>
                <legend>Publish Company Document</legend>
                {formSuccess && <p><strong>Success:</strong> {formSuccess}</p>}

                <p>
                  <label htmlFor="policyTitle">Policy Title: </label>
                  <br />
                  <input
                    id="policyTitle"
                    name="title"
                    type="text"
                    required
                    placeholder="e.g. Clean Desk & Confidentiality Policy"
                    style={{ width: '350px' }}
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
                    cols="60"
                    required
                    placeholder="Document the requirements, rules, and developer expectations..."
                    value={formData.summaryMarkdown}
                    onChange={handleFormChange}
                  />
                </p>

                <p>
                  <label>
                    <input
                      name="isMandatory"
                      type="checkbox"
                      checked={formData.isMandatory}
                      onChange={handleFormChange}
                    />
                    {' '}Mandatory acknowledgement for all outstaffed developers
                  </label>
                </p>

                <button type="submit">Publish Policy</button>
              </fieldset>
            </form>
          </details>
        </>
      )}
    </section>
  );
}
