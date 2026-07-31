import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const emptyAuthForm = {
  name: '',
  email: '',
  password: '',
};

const emptyAssignmentForm = {
  name: '',
  priority: '2',
  completed: false,
  duedate: '',
};

const todayString = new Date().toISOString().split('T')[0];

function App() {
  const [mode, setMode] = useState('login');
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [assignments, setAssignments] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('high-to-low');
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sortAssignments = (items) => {
    return [...items].sort((left, right) => {
      if (sortOrder === 'low-to-high') {
        return left.priority - right.priority;
      }

      return right.priority - left.priority;
    });
  };

  const visibleAssignments = useMemo(() => {
    const filtered = assignments.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    return sortAssignments(filtered);
  }, [assignments, searchTerm, sortOrder]);

  const allTasksByPriority = useMemo(() => {
    return sortAssignments(assignments);
  }, [assignments, sortOrder]);

  const stats = useMemo(() => {
    const completed = assignments.filter((item) => item.completed).length;
    return {
      total: assignments.length,
      completed,
      pending: assignments.length - completed,
    };
  }, [assignments]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setAssignments([]);
      return;
    }

    loadSession(token);
  }, [token]);

  const request = async (path, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  };

  const loadSession = async (activeToken) => {
    try {
      setLoading(true);
      const meResponse = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (!meResponse.ok) {
        throw new Error('Session expired');
      }

      const meData = await meResponse.json();
      setUser(meData.user);

      const assignmentsData = await fetch(`${API_BASE}/assignment`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (!assignmentsData.ok) {
        throw new Error('Could not load assignments');
      }

      const listData = await assignmentsData.json();
      setAssignments(listData.assignments || []);
      setMessage('');
    } catch (error) {
      localStorage.removeItem('token');
      setToken('');
      setUser(null);
      setAssignments([]);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      const payload =
        mode === 'register'
          ? authForm
          : { email: authForm.email, password: authForm.password };

      const data = await request(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setAuthForm(emptyAuthForm);
      setMode('login');
      setMessage(data.message);
      await loadSession(data.token);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSubmit = async (event) => {
    event.preventDefault();

    try {
      if (assignmentForm.duedate && assignmentForm.duedate < todayString) {
        setMessage('Due date cannot be in the past.');
        return;
      }

      setLoading(true);
      const payload = {
        ...assignmentForm,
        priority: Number(assignmentForm.priority),
      };

      if (editingId) {
        await request(`/assignment/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await request('/assignment', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setAssignmentForm(emptyAssignmentForm);
      setEditingId('');
      await loadSession(token);
      setMessage(editingId ? 'Assignment updated.' : 'Assignment added.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (assignment) => {
    setEditingId(assignment._id);
    setAssignmentForm({
      name: assignment.name,
      priority: String(assignment.priority),
      completed: Boolean(assignment.completed),
      duedate: assignment.duedate ? assignment.duedate.slice(0, 10) : '',
    });
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await request(`/assignment/${id}`, { method: 'DELETE' });
      await loadSession(token);
      setMessage('Assignment deleted.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (assignment) => {
    try {
      setLoading(true);
      await request(`/assignment/${assignment._id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !assignment.completed }),
      });
      await loadSession(token);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setAssignments([]);
    setAssignmentForm(emptyAssignmentForm);
    setEditingId('');
    setSearchTerm('');
    setSortOrder('high-to-low');
    setShowAllTasks(false);
    setMessage('Logged out.');
  };

  if (!token || !user) {
    return (
      <main className="page-shell auth-shell">
        <section className="hero-card">
          <p className="eyebrow">Student Task Manager</p>
          <h1>Keep class work in one calm place.</h1>
          <p className="hero-copy">
            A small app for login, assignments, and simple tracking. Nothing fancy.
          </p>

          <div className="auth-toggle">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
              Login
            </button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
              Register
            </button>
          </div>
        </section>

        <section className="panel auth-panel">
          <form onSubmit={handleAuthSubmit} className="form-stack">
            {mode === 'register' && (
              <label>
                Name
                <input
                  value={authForm.name}
                  onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                  placeholder="Your name"
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                placeholder="name@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                placeholder="••••••••"
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Login'}
            </button>
          </form>

          {message ? <p className="status-text">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell dashboard-shell">
      <header className="topbar panel">
        <div>
          <p className="eyebrow">Student Task Manager</p>
          <h2>Welcome back, {user.name}</h2>
          <p className="subtle">A simple place to keep assignments under control.</p>
        </div>
        <button className="ghost-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="stats-grid">
        <article className="stat-card panel">
          <span>Total</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="stat-card panel">
          <span>Done</span>
          <strong>{stats.completed}</strong>
        </article>
        <article className="stat-card panel">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel form-panel">
          <div className="panel-header">
            <h3>{editingId ? 'Edit assignment' : 'Add assignment'}</h3>
            {editingId ? (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setEditingId('');
                  setAssignmentForm(emptyAssignmentForm);
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>

          <form onSubmit={handleAssignmentSubmit} className="form-stack">
            <label>
              Task name
              <input
                value={assignmentForm.name}
                onChange={(event) => setAssignmentForm({ ...assignmentForm, name: event.target.value })}
                placeholder="Math homework"
                required
              />
            </label>

            <label>
              Priority
              <select
                value={assignmentForm.priority}
                onChange={(event) => setAssignmentForm({ ...assignmentForm, priority: event.target.value })}
              >
                <option value="1">Low</option>
                <option value="2">Medium</option>
                <option value="3">High</option>
              </select>
            </label>

            <label>
              Due date
              <input
                type="date"
                value={assignmentForm.duedate}
                min={todayString}
                onChange={(event) => setAssignmentForm({ ...assignmentForm, duedate: event.target.value })}
                required
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={assignmentForm.completed}
                onChange={(event) => setAssignmentForm({ ...assignmentForm, completed: event.target.checked })}
              />
              Mark as completed
            </label>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update task' : 'Add task'}
            </button>
          </form>

          {message ? <p className="status-text">{message}</p> : null}
        </article>

        <article className="panel list-panel">
          <div className="panel-header">
            <div className="header-title-row">
              <h3>Your tasks</h3>
              <button type="button" className="text-button" onClick={() => setShowAllTasks(true)}>
                View all tasks
              </button>
            </div>
            <span className="count-pill">{assignments.length}</span>
          </div>

          <div className="task-toolbar">
            <label>
              Search tasks
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name"
              />
            </label>

            <label>
              Sort by priority
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="high-to-low">High to low</option>
                <option value="low-to-high">Low to high</option>
              </select>
            </label>
          </div>

          <div className="task-list">
            {visibleAssignments.length === 0 ? (
              <p className="empty-state">No assignments match your search.</p>
            ) : (
              visibleAssignments.map((assignment) => (
                <div className={`task-card ${assignment.completed ? 'done' : ''}`} key={assignment._id}>
                  <div className="task-main">
                    <div>
                      <h4>{assignment.name}</h4>
                      <p>
                        Priority: {assignment.priority === 3 ? 'High' : assignment.priority === 2 ? 'Medium' : 'Low'}
                      </p>
                      <p>Due: {new Date(assignment.duedate).toLocaleDateString()}</p>
                    </div>

                    <button className="toggle-button" onClick={() => handleToggleComplete(assignment)}>
                      {assignment.completed ? 'Undo' : 'Done'}
                    </button>
                  </div>

                  <div className="task-actions">
                    <button className="text-button" onClick={() => startEdit(assignment)}>
                      Edit
                    </button>
                    <button className="text-button danger" onClick={() => handleDelete(assignment._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {showAllTasks ? (
        <div className="modal-overlay" onClick={() => setShowAllTasks(false)}>
          <section className="modal-card panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">All tasks</p>
                <h3>Everything in one scrollable view</h3>
              </div>
              <button type="button" className="ghost-button" onClick={() => setShowAllTasks(false)}>
                Close
              </button>
            </div>

            <div className="modal-list">
              {allTasksByPriority.length === 0 ? (
                <p className="empty-state">No tasks yet.</p>
              ) : (
                allTasksByPriority.map((assignment) => (
                  <div className={`task-card ${assignment.completed ? 'done' : ''}`} key={assignment._id}>
                    <div className="task-main">
                      <div>
                        <h4>{assignment.name}</h4>
                        <p>
                          Priority: {assignment.priority === 3 ? 'High' : assignment.priority === 2 ? 'Medium' : 'Low'}
                        </p>
                        <p>Due: {new Date(assignment.duedate).toLocaleDateString()}</p>
                      </div>

                      <span className="priority-badge">P{assignment.priority}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default App;