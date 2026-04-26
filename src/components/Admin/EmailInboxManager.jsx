import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "../UI/Card";
import Button from "../UI/Button";
import Badge from "../UI/Badge";
import {
  createEmailConnection,
  createEmailThread,
  fetchEmailConnections,
  fetchEmailProviders,
  fetchEmailSyncJobs,
  fetchEmailThreads,
  linkEmailThread,
  runEmailConnectionHealthCheck,
  runEmailConnectionSync,
} from "../../services/api";

const defaultThreadForm = {
  connectionId: "",
  providerThreadId: "",
  subject: "",
  participants: "",
  mailboxFolder: "inbox",
  previewText: "",
  status: "open",
  aiDraftStatus: "none",
};

const createConnectionForm = (provider) => ({
  provider: provider?.id || "gmail",
  connectionType: provider?.connectionTypes?.[0] || "mailbox",
  label: "",
  status: "draft",
  authMode: provider?.authModes?.[0] || "oauth",
  accountIdentifier: "",
  scopes: (provider?.defaultScopes || []).join(","),
});

const EmailInboxManager = () => {
  const [providers, setProviders] = useState([]);
  const [connections, setConnections] = useState([]);
  const [syncJobs, setSyncJobs] = useState([]);
  const [threads, setThreads] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState("gmail");
  const [connectionForm, setConnectionForm] = useState(createConnectionForm());
  const [threadForm, setThreadForm] = useState(defaultThreadForm);
  const [loading, setLoading] = useState(true);
  const [savingConnection, setSavingConnection] = useState(false);
  const [savingThread, setSavingThread] = useState(false);
  const [checkingConnectionId, setCheckingConnectionId] = useState("");
  const [syncingConnectionId, setSyncingConnectionId] = useState("");
  const [linkingThreadId, setLinkingThreadId] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const focusedThreadId =
    searchParams.get("recordType") === "email-thread" ? searchParams.get("recordId") || "" : "";

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === selectedProviderId) || null,
    [providers, selectedProviderId]
  );

  const loadInboxData = async () => {
    setLoading(true);
    setError("");

    try {
      const [providersResponse, connectionsResponse, threadsResponse, jobsResponse] = await Promise.all([
        fetchEmailProviders(),
        fetchEmailConnections(),
        fetchEmailThreads(),
        fetchEmailSyncJobs(),
      ]);

      const nextProviders = providersResponse.data?.providers || [];
      const nextConnections = connectionsResponse.data || [];
      const nextJobs = jobsResponse.data || [];
      const nextThreads = threadsResponse.data || [];
      const preferredProvider =
        nextProviders.find((provider) => provider.id === selectedProviderId) ||
        nextProviders[0] ||
        null;

      setProviders(nextProviders);
      setSelectedProviderId(preferredProvider?.id || "");
      setConnectionForm((current) => ({
        ...createConnectionForm(preferredProvider),
        label: current.label,
        accountIdentifier: current.accountIdentifier,
      }));
      setConnections(nextConnections);
      setSyncJobs(nextJobs);
      setThreads(nextThreads);
      setThreadForm((current) => ({
        ...current,
        connectionId: current.connectionId || nextConnections[0]?._id || "",
      }));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load inbox integration data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInboxData();
  }, []);

  useEffect(() => {
    if (!selectedProvider) {
      return;
    }

    setConnectionForm((current) => ({
      ...current,
      provider: selectedProvider.id,
      connectionType: selectedProvider.connectionTypes?.[0] || "mailbox",
      authMode: selectedProvider.authModes?.[0] || "oauth",
      scopes: (selectedProvider.defaultScopes || []).join(","),
    }));
  }, [selectedProvider]);

  const handleCreateConnection = async (event) => {
    event.preventDefault();
    setSavingConnection(true);
    setError("");

    try {
      await createEmailConnection({
        ...connectionForm,
        scopes: connectionForm.scopes
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      });
      setConnectionForm(createConnectionForm(selectedProvider));
      await loadInboxData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to save the provider connection."
      );
    } finally {
      setSavingConnection(false);
    }
  };

  const handleCreateThread = async (event) => {
    event.preventDefault();
    setSavingThread(true);
    setError("");

    try {
      await createEmailThread({
        ...threadForm,
        participants: threadForm.participants
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      });
      setThreadForm((current) => ({
        ...defaultThreadForm,
        connectionId: current.connectionId,
      }));
      await loadInboxData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to save the inbox thread."
      );
    } finally {
      setSavingThread(false);
    }
  };

  const handleHealthCheck = async (connectionId) => {
    setCheckingConnectionId(connectionId);
    setError("");

    try {
      await runEmailConnectionHealthCheck(connectionId);
      await loadInboxData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to run the provider health check."
      );
    } finally {
      setCheckingConnectionId("");
    }
  };

  const handleSync = async (connectionId) => {
    setSyncingConnectionId(connectionId);
    setError("");

    try {
      await runEmailConnectionSync(connectionId);
      await loadInboxData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to run the provider sync scaffold."
      );
    } finally {
      setSyncingConnectionId("");
    }
  };

  const handleLinkThread = async (threadId, payload) => {
    setLinkingThreadId(threadId);
    setError("");

    try {
      await linkEmailThread(threadId, payload);
      await loadInboxData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to link the support record to this thread."
      );
    } finally {
      setLinkingThreadId("");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            Inbox Foundation
          </p>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
            Email Integrations
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-2 max-w-2xl">
            The inbox layer now reads from a backend provider registry, so the admin
            UI is aligned with provider capabilities, auth modes, and setup checklists.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="primary">{connections.length} Connections</Badge>
          <Badge variant="secondary">{threads.length} Threads</Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[0.85fr_1.15fr] gap-8">
        <Card className="p-8 border-none shadow-xl">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
              Provider Catalog
            </p>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Supported Providers
            </h3>
          </div>

          <div className="space-y-4">
            {providers.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => setSelectedProviderId(provider.id)}
                className={`w-full text-left rounded-3xl border p-5 transition ${
                  selectedProviderId === provider.id
                    ? "border-primary/30 bg-primary/5"
                    : "border-slate-100 bg-slate-50 hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-slate-900">{provider.label}</p>
                    <p className="text-xs text-primary font-black uppercase tracking-widest mt-1">
                      {provider.authModes.join(" / ")}
                    </p>
                  </div>
                  <Badge variant={provider.syncReadiness === "planned" ? "secondary" : "primary"}>
                    {provider.syncReadiness}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-3">
                  Default scopes: {(provider.defaultScopes || []).join(", ")}
                </p>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-8">
          <Card className="p-8 border-none shadow-xl">
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
                Step 1
              </p>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Add Provider Connection
              </h3>
            </div>

            {selectedProvider && (
              <div className="rounded-3xl bg-primary/5 border border-primary/10 px-5 py-4 mb-5">
                <p className="text-sm font-black text-slate-900">{selectedProvider.label}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 font-medium">
                  {selectedProvider.setupChecklist?.map((step) => (
                    <li key={step}>• {step}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleCreateConnection} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={connectionForm.label}
                  onChange={(event) =>
                    setConnectionForm((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  placeholder="Connection label"
                  className="bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-primary"
                  required
                />
                <input
                  type="email"
                  value={connectionForm.accountIdentifier}
                  onChange={(event) =>
                    setConnectionForm((current) => ({
                      ...current,
                      accountIdentifier: event.target.value,
                    }))
                  }
                  placeholder="Mailbox address"
                  className="bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-primary"
                  required
                />
                <select
                  value={selectedProviderId}
                  onChange={(event) => setSelectedProviderId(event.target.value)}
                  className="bg-slate-50 p-4 rounded-2xl font-black uppercase text-xs border-none focus:ring-2 focus:ring-primary"
                >
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.label}
                    </option>
                  ))}
                </select>
                <select
                  value={connectionForm.authMode}
                  onChange={(event) =>
                    setConnectionForm((current) => ({
                      ...current,
                      authMode: event.target.value,
                    }))
                  }
                  className="bg-slate-50 p-4 rounded-2xl font-black uppercase text-xs border-none focus:ring-2 focus:ring-primary"
                >
                  {(selectedProvider?.authModes || []).map((authMode) => (
                    <option key={authMode} value={authMode}>
                      {authMode}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                rows={3}
                value={connectionForm.scopes}
                onChange={(event) =>
                  setConnectionForm((current) => ({
                    ...current,
                    scopes: event.target.value,
                  }))
                }
                placeholder="Comma-separated scopes"
                className="w-full bg-slate-50 p-4 rounded-2xl font-medium border-none focus:ring-2 focus:ring-primary"
              />

              <div className="rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3 text-sm text-slate-600 font-medium">
                Credentials are still intentionally withheld here. The provider
                registry now gives us the right auth mode, scopes, and readiness
                notes while secure secret storage comes next.
              </div>

              <Button type="submit" disabled={savingConnection}>
                {savingConnection ? "Saving Connection..." : "Add Connection"}
              </Button>
            </form>
          </Card>

          <Card className="p-8 border-none shadow-xl">
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
                Step 2
              </p>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Seed Inbox Thread
              </h3>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-4">
              <select
                value={threadForm.connectionId}
                onChange={(event) =>
                  setThreadForm((current) => ({
                    ...current,
                    connectionId: event.target.value,
                  }))
                }
                className="w-full bg-slate-50 p-4 rounded-2xl font-black uppercase text-xs border-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select connection</option>
                {connections.map((connection) => (
                  <option key={connection._id} value={connection._id}>
                    {connection.label} ({connection.provider})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={threadForm.providerThreadId}
                  onChange={(event) =>
                    setThreadForm((current) => ({
                      ...current,
                      providerThreadId: event.target.value,
                    }))
                  }
                  placeholder="Provider thread ID"
                  className="bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-primary"
                  required
                />
                <input
                  type="text"
                  value={threadForm.subject}
                  onChange={(event) =>
                    setThreadForm((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                  placeholder="Thread subject"
                  className="bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <input
                type="text"
                value={threadForm.participants}
                onChange={(event) =>
                  setThreadForm((current) => ({
                    ...current,
                    participants: event.target.value,
                  }))
                }
                placeholder="Participant emails, comma separated"
                className="w-full bg-slate-50 p-4 rounded-2xl font-medium border-none focus:ring-2 focus:ring-primary"
              />

              <textarea
                rows={3}
                value={threadForm.previewText}
                onChange={(event) =>
                  setThreadForm((current) => ({
                    ...current,
                    previewText: event.target.value,
                  }))
                }
                placeholder="Latest message preview"
                className="w-full bg-slate-50 p-4 rounded-2xl font-medium border-none focus:ring-2 focus:ring-primary"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={threadForm.mailboxFolder}
                  onChange={(event) =>
                    setThreadForm((current) => ({
                      ...current,
                      mailboxFolder: event.target.value,
                    }))
                  }
                  className="bg-slate-50 p-4 rounded-2xl font-black uppercase text-xs border-none focus:ring-2 focus:ring-primary"
                >
                  <option value="inbox">Inbox</option>
                  <option value="archive">Archive</option>
                  <option value="sent">Sent</option>
                </select>
                <select
                  value={threadForm.aiDraftStatus}
                  onChange={(event) =>
                    setThreadForm((current) => ({
                      ...current,
                      aiDraftStatus: event.target.value,
                    }))
                  }
                  className="bg-slate-50 p-4 rounded-2xl font-black uppercase text-xs border-none focus:ring-2 focus:ring-primary"
                >
                  <option value="none">No AI Draft</option>
                  <option value="ready">Draft Ready</option>
                  <option value="sent">Draft Sent</option>
                </select>
              </div>

              <Button type="submit" disabled={savingThread || !connections.length}>
                {savingThread ? "Saving Thread..." : "Add Thread"}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="p-8 border-none shadow-lg">
          <div className="flex justify-between items-center gap-4 mb-6">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Registered Connections
            </h3>
            {loading && (
              <span className="text-xs font-black uppercase text-slate-400">Loading...</span>
            )}
          </div>

          <div className="space-y-4">
            {connections.map((connection) => (
              <div
                key={connection._id}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-5"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-lg font-black text-slate-900">{connection.label}</p>
                    <p className="text-sm text-primary font-bold uppercase tracking-widest">
                      {connection.provider} • {connection.authMode}
                    </p>
                    <p className="text-sm text-slate-500 font-medium mt-2">
                      {connection.accountIdentifier || "No mailbox identifier saved"}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-2">
                      {(connection.metadata?.setupChecklist || []).join(" ")}
                    </p>
                    {connection.metadata?.healthCheck?.message && (
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                          Latest Health Check
                        </p>
                        <p className="text-sm text-slate-700 font-medium mt-2">
                          {connection.metadata.healthCheck.message}
                        </p>
                        <p className="text-xs text-primary font-bold mt-2">
                          Next: {connection.metadata.healthCheck.nextStep}
                        </p>
                      </div>
                    )}
                    {connection.metadata?.lastSyncJob?.resultSummary && (
                      <p className="text-xs text-slate-500 font-medium mt-3">
                        Last sync: {connection.metadata.lastSyncJob.resultSummary}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {connection.metadata?.syncReadiness || connection.status || "draft"}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => handleHealthCheck(connection._id)}
                      disabled={checkingConnectionId === connection._id}
                      className="block mt-3 text-[10px] font-black uppercase tracking-widest text-primary disabled:text-slate-400"
                    >
                      {checkingConnectionId === connection._id
                        ? "Checking..."
                        : "Run Health Check"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSync(connection._id)}
                      disabled={syncingConnectionId === connection._id}
                      className="block mt-2 text-[10px] font-black uppercase tracking-widest text-slate-700 disabled:text-slate-400"
                    >
                      {syncingConnectionId === connection._id
                        ? "Syncing..."
                        : "Run Sync"}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && connections.length === 0 && (
              <p className="text-sm text-slate-500 font-medium">
                No provider connections yet. Add one above to start the inbox model.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-8 border-none shadow-lg">
          <div className="flex justify-between items-center gap-4 mb-6">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Inbox Threads
            </h3>
            {loading && (
              <span className="text-xs font-black uppercase text-slate-400">Loading...</span>
            )}
          </div>

          <div className="space-y-4">
              {threads.map((thread) => (
                <div
                  key={thread._id}
                  className={`rounded-3xl border bg-white p-5 shadow-sm ${
                    focusedThreadId === String(thread._id)
                      ? "border-primary shadow-lg shadow-primary/10"
                      : "border-slate-100"
                  }`}
                >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-lg font-black text-slate-900">{thread.subject}</p>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      {thread.previewText || "No preview text yet"}
                    </p>
                  </div>
                  <Badge variant="primary">{thread.aiDraftStatus || "none"}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest">
                    {thread.mailboxFolder || "inbox"}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest">
                    {thread.status || "open"}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {thread.participants?.length > 0 && (
                    <p className="text-xs text-slate-500 font-medium">
                      Participants: {thread.participants.join(", ")}
                    </p>
                  )}

                  {thread.linkedInquiry && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        Linked Inquiry
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-1">
                        {thread.linkedInquiry.name}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {thread.linkedInquiry.email} • {thread.linkedInquiry.status}
                      </p>
                    </div>
                  )}

                  {thread.linkedContactMessage && (
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-700">
                        Linked Contact Message
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-1">
                        {thread.linkedContactMessage.name}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {thread.linkedContactMessage.email} • {thread.linkedContactMessage.status}
                      </p>
                    </div>
                  )}

                  {(thread.supportMatches?.inquiries?.length > 0 ||
                    thread.supportMatches?.contactMessages?.length > 0) && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                        Suggested Support Links
                      </p>

                      {thread.supportMatches?.inquiries?.map((match) => (
                        <div
                          key={`inquiry-${match._id}`}
                          className="flex items-center justify-between gap-3 py-2 border-b border-slate-200 last:border-b-0"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-800">{match.name}</p>
                            <p className="text-xs text-slate-500 font-medium">
                              Inquiry • {match.email} • {match.status}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleLinkThread(thread._id, { inquiryId: match._id })
                            }
                            disabled={linkingThreadId === thread._id}
                            className="text-[10px] font-black uppercase tracking-widest text-primary disabled:text-slate-400"
                          >
                            {linkingThreadId === thread._id ? "Linking..." : "Link"}
                          </button>
                        </div>
                      ))}

                      {thread.supportMatches?.contactMessages?.map((match) => (
                        <div
                          key={`message-${match._id}`}
                          className="flex items-center justify-between gap-3 py-2 border-b border-slate-200 last:border-b-0"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-800">{match.name}</p>
                            <p className="text-xs text-slate-500 font-medium">
                              Contact • {match.email} • {match.status}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleLinkThread(thread._id, {
                                contactMessageId: match._id,
                              })
                            }
                            disabled={linkingThreadId === thread._id}
                            className="text-[10px] font-black uppercase tracking-widest text-primary disabled:text-slate-400"
                          >
                            {linkingThreadId === thread._id ? "Linking..." : "Link"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!loading && threads.length === 0 && (
              <p className="text-sm text-slate-500 font-medium">
                No inbox threads yet. Seed one above to validate the thread model.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-8 border-none shadow-lg">
          <div className="flex justify-between items-center gap-4 mb-6">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Sync Job History
            </h3>
            {loading && (
              <span className="text-xs font-black uppercase text-slate-400">Loading...</span>
            )}
          </div>

          <div className="space-y-4">
            {syncJobs.map((job) => (
              <div
                key={job._id}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-5"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-lg font-black text-slate-900">{job.provider}</p>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      {job.resultSummary || "No summary"}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-2">
                      Discovered: {job.recordsDiscovered || 0} • Processed: {job.recordsProcessed || 0}
                    </p>
                  </div>
                  <Badge variant={job.status === "completed" ? "primary" : "secondary"}>
                    {job.status}
                  </Badge>
                </div>
              </div>
            ))}

            {!loading && syncJobs.length === 0 && (
              <p className="text-sm text-slate-500 font-medium">
                No sync jobs yet. Run a connection sync to capture the first operation.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EmailInboxManager;
