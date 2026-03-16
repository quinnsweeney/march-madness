import { useState, useEffect } from "react";
import { Settings, Save, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Team } from "../types";

export default function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTeams(data);
        } else {
          setTeams([]);
        }
      })
      .catch((e) => console.error("Could not load backend:", e));
  }, []);

  const handleSave = async (id?: string) => {
    setStatus("Saving...");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teams, null, 2),
      });
      if (res.ok) {
        setStatus("Saved successfully!");
        if (id) {
          setEditingId(null);
        }
        setTimeout(() => setStatus(""), 3000);
      } else {
        setStatus("Save failed.");
      }
    } catch (e) {
      console.error(e);
      setStatus("Error saving.");
    }
  };

  const addTeam = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newTeam: Team = {
      id: newId,
      name: "",
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
      city: "",
      state: "",
      mascot: "",
      logo: "",
      alumni: "",
      seed: 0,
      region: "",
      espn_id: "",
      alumni_summary: "",
    };
    setTeams([newTeam, ...teams]);
    setEditingId(newId);
  };

  const updateTeam = <K extends keyof Team>(
    id: string,
    field: K,
    value: Team[K],
  ) => {
    setTeams(teams.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const deleteTeam = (id: string) => {
    if (confirm("Are you sure you want to delete this team?")) {
      setTeams(teams.filter((t) => t.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  // Helper to fetch logos directly from ESPN using their team ID
  const getImageUrl = (espnId: string | number | null) => {
    if (!espnId) return "";
    return `https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`;
  };

  return (
    <div
      className="admin-container"
      style={{
        padding: "2rem",
        maxWidth: "1200px",
        margin: "0 auto",
        color: "var(--color, inherit)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "2rem",
          }}
        >
          <Settings /> Team Data Editor
        </h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {status && <span style={{ opacity: 0.8 }}>{status}</span>}
          <Link
            to="/admin/bracket"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0.5rem 1rem",
              background: "#e5e7eb",
              color: "#000",
              textDecoration: "none",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Bracket Seeding
          </Link>
          <button
            onClick={addTeam}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.5rem 1rem",
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            <Plus size={18} /> Add Team
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {teams.map((team) =>
          editingId === team.id ? (
            <div
              key={team.id}
              style={{
                width: "100%",
                border: "1px solid #ddd",
                padding: "1.5rem",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                background: "rgba(128,128,128,0.05)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                    School Name
                  </label>
                  <input
                    value={team.name}
                    onChange={(e) =>
                      updateTeam(team.id, "name", e.target.value)
                    }
                    placeholder="e.g. Duke"
                    style={{ padding: "0.5rem", width: "100%" }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                    Mascot
                  </label>
                  <input
                    value={team.mascot}
                    onChange={(e) =>
                      updateTeam(team.id, "mascot", e.target.value)
                    }
                    placeholder="e.g. Blue Devils"
                    style={{ padding: "0.5rem", width: "100%" }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                    City
                  </label>
                  <input
                    value={team.city}
                    onChange={(e) =>
                      updateTeam(team.id, "city", e.target.value)
                    }
                    placeholder="e.g. Durham"
                    style={{ padding: "0.5rem", width: "100%" }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                    State
                  </label>
                  <input
                    value={team.state}
                    onChange={(e) =>
                      updateTeam(team.id, "state", e.target.value)
                    }
                    placeholder="e.g. NC"
                    style={{ padding: "0.5rem", width: "100%" }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                    ESPN ID
                  </label>
                  <input
                    value={team.espn_id || ""}
                    onChange={(e) =>
                      updateTeam(team.id, "espn_id", e.target.value)
                    }
                    placeholder="e.g. 150 (Duke)"
                    style={{ padding: "0.5rem", width: "100%" }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                    Famous Alumni
                  </label>
                  <input
                    value={team.alumni}
                    onChange={(e) =>
                      updateTeam(team.id, "alumni", e.target.value)
                    }
                    placeholder="e.g. Zion Williamson"
                    style={{ padding: "0.5rem", width: "100%" }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    gridColumn: "1 / -1",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                      Primary Color
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        type="color"
                        value={team.primaryColor}
                        onChange={(e) =>
                          updateTeam(team.id, "primaryColor", e.target.value)
                        }
                        style={{ padding: "0", height: "35px", width: "35px" }}
                      />
                      <input
                        value={team.primaryColor}
                        onChange={(e) =>
                          updateTeam(team.id, "primaryColor", e.target.value)
                        }
                        style={{ padding: "0.5rem", width: "100%" }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                      Secondary Color
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        type="color"
                        value={team.secondaryColor}
                        onChange={(e) =>
                          updateTeam(team.id, "secondaryColor", e.target.value)
                        }
                        style={{ padding: "0", height: "35px", width: "35px" }}
                      />
                      <input
                        value={team.secondaryColor}
                        onChange={(e) =>
                          updateTeam(team.id, "secondaryColor", e.target.value)
                        }
                        style={{ padding: "0.5rem", width: "100%" }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                      Seed
                    </label>
                    <input
                      type="number"
                      value={team.seed === null ? "" : team.seed}
                      onChange={(e) =>
                        updateTeam(
                          team.id,
                          "seed",
                          parseInt(e.target.value) || null,
                        )
                      }
                      style={{ padding: "0.5rem", width: "100%" }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                      Region
                    </label>
                    <select
                      value={team.region || ""}
                      onChange={(e) =>
                        updateTeam(team.id, "region", e.target.value)
                      }
                      style={{ padding: "0.5rem", width: "100%" }}
                    >
                      <option value="">Select Region</option>
                      <option value="east">East</option>
                      <option value="west">West</option>
                      <option value="south">South</option>
                      <option value="midwest">Midwest</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "1rem",
                  borderTop: "1px solid rgba(128,128,128,0.2)",
                }}
              >
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    onClick={() => handleSave(team.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 1rem",
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <Save size={18} /> Save & Close
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#555",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
                <button
                  onClick={() => deleteTeam(team.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.5rem",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  title="Delete Team"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div
              key={team.id}
              onClick={() => setEditingId(team.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "1rem",
                borderRadius: "8px",
                cursor: "pointer",
                background: team.primaryColor || "#ddd",
                color: team.secondaryColor || "#000",
                border: `2px solid ${team.secondaryColor || "transparent"}`,
                width: "180px",
                minHeight: "180px",
                height: "auto",
                textAlign: "center",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                transition: "transform 0.1s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
              title="Click to edit"
            >
              {team.espn_id && (
                <img
                  src={getImageUrl(team.espn_id)}
                  alt="Logo"
                  style={{
                    height: "50px",
                    objectFit: "contain",
                    backgroundColor: "#fff",
                  }}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <strong
                style={{ fontSize: "1.2rem", lineHeight: "1.2", margin: 0 }}
              >
                {team.name || "New Team"}
              </strong>
              {team.mascot && (
                <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                  {team.mascot}
                </span>
              )}
              {(team.seed || team.region) && (
                <span
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.8,
                    background: "rgba(0,0,0,0.2)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {team.seed ? `#${team.seed} ` : ""}
                  {team.region}
                </span>
              )}
            </div>
          ),
        )}

        {teams.length === 0 && (
          <div
            style={{
              width: "100%",
              textAlign: "center",
              padding: "4rem",
              opacity: 0.5,
            }}
          >
            No teams found. Click "Add Team" to start.
          </div>
        )}
      </div>
    </div>
  );
}
