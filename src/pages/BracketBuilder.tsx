import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import teamsData from "../teams.json";
import type { Team } from "../types";

type Matchup = {
  id: string;
  teamA: Team | null;
  teamB: Team | null;
  nextMatchupId: string | null;
  isSubA: boolean; // if true, winner goes to teamA slot of nextMatchupId
  round: number;
  region: string | null; // For final four it might be null
};

type RoundOneSeedSlot = {
  nextMatchupId: string;
  isSubA: boolean;
};

const ROUND_ONE_SEED_ORDER = [
  1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15,
];

const getTeamsBySeed = (regionTeams: Team[]) => {
  const teamsBySeed = new Map<number, Team[]>();
  regionTeams.forEach((team) => {
    if (team.seed == null) return;
    const existing = teamsBySeed.get(team.seed) || [];
    teamsBySeed.set(team.seed, [...existing, team]);
  });
  return teamsBySeed;
};

const findNextPlayableMatchup = (
  allMatchups: Matchup[],
  currentChampion: Team | null,
) => {
  const orderedMatchups = [...allMatchups].sort((a, b) => a.round - b.round);

  for (let round = 0; round <= 6; round++) {
    const gamesInRound = orderedMatchups.filter(
      (m) => m.round === round && m.teamA !== null && m.teamB !== null,
    );

    for (const game of gamesInRound) {
      if (game.nextMatchupId) {
        const nextGame = orderedMatchups.find(
          (nx) => nx.id === game.nextMatchupId,
        );
        if (!nextGame) continue;

        const hasAdvancedWinner = game.isSubA
          ? nextGame.teamA !== null
          : nextGame.teamB !== null;
        if (!hasAdvancedWinner) {
          return game;
        }
      } else if (round === 6 && !currentChampion) {
        return game;
      }
    }
  }

  return null;
};

// Bracket structure helper for a single region's standard 16 teams (after play-in)
const getRegionInitialMatchups = (
  regionTeams: Team[],
  regionName: string,
  idPrefix: string,
) => {
  const teamsBySeed = getTeamsBySeed(regionTeams);
  const seedSlots = new Map<number, RoundOneSeedSlot>();
  const matchups: Matchup[] = [];

  for (let i = 0; i < 8; i++) {
    const seedA = ROUND_ONE_SEED_ORDER[i * 2];
    const seedB = ROUND_ONE_SEED_ORDER[i * 2 + 1];
    const teamAOptions = teamsBySeed.get(seedA) || [];
    const teamBOptions = teamsBySeed.get(seedB) || [];
    const id = `${idPrefix}_R1_${i + 1}`;

    matchups.push({
      id,
      teamA: teamAOptions.length === 1 ? teamAOptions[0] : null,
      teamB: teamBOptions.length === 1 ? teamBOptions[0] : null,
      nextMatchupId: `${idPrefix}_R2_${Math.floor(i / 2) + 1}`,
      isSubA: i % 2 === 0,
      round: 1,
      region: regionName,
    });

    seedSlots.set(seedA, { nextMatchupId: id, isSubA: true });
    seedSlots.set(seedB, { nextMatchupId: id, isSubA: false });
  }

  for (let i = 0; i < 4; i++) {
    matchups.push({
      id: `${idPrefix}_R2_${i + 1}`,
      teamA: null,
      teamB: null,
      nextMatchupId: `${idPrefix}_R3_${Math.floor(i / 2) + 1}`,
      isSubA: i % 2 === 0,
      round: 2,
      region: regionName,
    });
  }

  for (let i = 0; i < 2; i++) {
    matchups.push({
      id: `${idPrefix}_R3_${i + 1}`,
      teamA: null,
      teamB: null,
      nextMatchupId: `${idPrefix}_E8`,
      isSubA: i === 0,
      round: 3,
      region: regionName,
    });
  }

  matchups.push({
    id: `${idPrefix}_E8`,
    teamA: null,
    teamB: null,
    nextMatchupId: `F4_${regionName === "east" || regionName === "south" ? "1" : "2"}`,
    isSubA: regionName === "east" || regionName === "west",
    round: 4,
    region: regionName,
  });

  return { matchups, seedSlots };
};

const buildBracket = (teams: any[]) => {
  const validTeams = teams.filter((t) => t.region && t.seed) as Team[];
  const regions = ["east", "west", "south", "midwest"];
  let matchups: Matchup[] = [];

  regions.forEach((r) => {
    const rTeams = validTeams.filter((t) => t.region === r);
    const teamsBySeed = getTeamsBySeed(rTeams);
    const regionStructure = getRegionInitialMatchups(rTeams, r, r);

    teamsBySeed.forEach((seededTeams, seed) => {
      if (seededTeams.length < 2) return;
      const slot = regionStructure.seedSlots.get(seed);
      if (!slot) return;

      const playIn: Matchup = {
        id: `PI_${r}_${seed}`,
        teamA: seededTeams[0] || null,
        teamB: seededTeams[1] || null,
        nextMatchupId: slot.nextMatchupId,
        isSubA: slot.isSubA,
        round: 0,
        region: r,
      };

      matchups.push(playIn);
    });

    matchups = matchups.concat(regionStructure.matchups);
  });

  // Final Four & Championship
  const f4_1: Matchup = {
    id: `F4_1`,
    teamA: null,
    teamB: null,
    nextMatchupId: `CHAMP`,
    isSubA: true,
    round: 5,
    region: "Final Four",
  };
  const f4_2: Matchup = {
    id: `F4_2`,
    teamA: null,
    teamB: null,
    nextMatchupId: `CHAMP`,
    isSubA: false,
    round: 5,
    region: "Final Four",
  };
  const champ: Matchup = {
    id: `CHAMP`,
    teamA: null,
    teamB: null,
    nextMatchupId: null,
    isSubA: false,
    round: 6,
    region: "Championship",
  };

  matchups.push(f4_1, f4_2, champ);

  return matchups;
};

export default function BracketBuilder() {
  const [searchParams] = useSearchParams();
  const criteria = searchParams.get("criteria") || "name";
  const navigate = useNavigate();

  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [currentMatchupId, setCurrentMatchupId] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<"left" | "right" | null>(
    null,
  );
  const [champion, setChampion] = useState<Team | null>(null);

  // Tracking history
  const [choices, setChoices] = useState<{ matchupId: string; winner: Team }[]>(
    [],
  );
  const [totalMatchups, setTotalMatchups] = useState(0);

  // Initialize Bracket once
  useEffect(() => {
    const initialMatchups = buildBracket(teamsData);
    setMatchups(initialMatchups);

    // There are exactly N-1 total games in a bracket (e.g. 67 for 68 teams)
    setTotalMatchups(initialMatchups.length);

    const firstGame = findNextPlayableMatchup(initialMatchups, null);
    if (firstGame) {
      setCurrentMatchupId(firstGame.id);
    }
  }, []);

  const activeMatchup = useMemo(() => {
    return matchups.find((m) => m.id === currentMatchupId) || null;
  }, [matchups, currentMatchupId]);

  const handleSelection = (side: "left" | "right") => {
    if (!activeMatchup) return;
    if (selectedSide) return; // prevent double clicks

    setSelectedSide(side);

    const winningTeam =
      side === "left" ? activeMatchup.teamA : activeMatchup.teamB;

    setTimeout(() => {
      setSelectedSide(null);

      if (winningTeam) {
        setChoices((prev) => [
          ...prev,
          { matchupId: activeMatchup.id, winner: winningTeam },
        ]);
      }

      if (!activeMatchup.nextMatchupId && winningTeam) {
        // Bracket is complete
        setChampion(winningTeam);
        setCurrentMatchupId(null);
        return;
      }

      let newMatchups = [...matchups];

      // Apply winner to next matchup
      if (activeMatchup.nextMatchupId) {
        const nextIdx = newMatchups.findIndex(
          (m) => m.id === activeMatchup.nextMatchupId,
        );
        if (nextIdx > -1) {
          if (activeMatchup.isSubA) {
            newMatchups[nextIdx] = {
              ...newMatchups[nextIdx],
              teamA: winningTeam,
            };
          } else {
            newMatchups[nextIdx] = {
              ...newMatchups[nextIdx],
              teamB: winningTeam,
            };
          }
        }
      }

      setMatchups(newMatchups);

      const nextM = findNextPlayableMatchup(newMatchups, champion);
      if (nextM) {
        setCurrentMatchupId(nextM.id);
      } else {
        setCurrentMatchupId(null);
      }
    }, 800);
  };

  const handleDevSkip = () => {
    let newMatchups = [...matchups];
    let newChoices = [...choices];
    let newChampion = champion;
    let currentM = findNextPlayableMatchup(newMatchups, newChampion);

    while (currentM) {
      const winningTeam = currentM.teamB || currentM.teamA;
      if (!winningTeam) break;

      newChoices.push({ matchupId: currentM.id, winner: winningTeam });

      if (!currentM.nextMatchupId) {
        newChampion = winningTeam;
        currentM = null;
        break;
      }

      const nextMatchupId = currentM.nextMatchupId;
      const nextIdx = newMatchups.findIndex((m) => m.id === nextMatchupId);
      if (nextIdx > -1) {
        if (currentM.isSubA) {
          newMatchups[nextIdx] = {
            ...newMatchups[nextIdx],
            teamA: winningTeam,
          };
        } else {
          newMatchups[nextIdx] = {
            ...newMatchups[nextIdx],
            teamB: winningTeam,
          };
        }
      }

      currentM = findNextPlayableMatchup(newMatchups, newChampion);
    }

    setMatchups(newMatchups);
    setChoices(newChoices);
    if (newChampion) {
      setChampion(newChampion);
      setCurrentMatchupId(null);
    } else {
      const nextM = findNextPlayableMatchup(newMatchups, newChampion);
      setCurrentMatchupId(nextM ? nextM.id : null);
    }
  };

  const renderTrait = (team: Team | null) => {
    if (!team) return "TBD";
    switch (criteria) {
      case "logo":
        return team.espn_id ? (
          <img
            src={`https://a.espncdn.com/i/teamlogos/ncaa/500-dark/${team.espn_id}.png`}
            alt={team.name}
            style={{ width: "120px", height: "120px", objectFit: "contain" }}
          />
        ) : (
          <span style={{ fontSize: "3rem" }}>🏀</span>
        );
      case "color":
        return (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                background: team.primaryColor,
                borderRadius: "50%",
                border: "4px solid #fff",
                boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
              }}
            />
            <div
              style={{
                width: "40px",
                height: "40px",
                background: team.secondaryColor,
                borderRadius: "50%",
                border: "2px solid #fff",
                boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
              }}
            />
          </div>
        );
      case "location":
        return (
          <h2 style={{ fontSize: "2.5rem" }}>
            {team.city}, {team.state}
          </h2>
        );
      case "mascot":
        return (
          <h2 style={{ fontSize: "2.5rem", color: team.primaryColor }}>
            The {team.mascot}
          </h2>
        );
      case "alumni":
        return (
          <h2 style={{ fontSize: "2.5rem" }}>
            {team.alumni || "Unknown Celeb"}
          </h2>
        );
      default:
        return <h2>{team.name}</h2>;
    }
  };

  const [bracketName, setBracketName] = useState("");

  if (champion) {
    const handleSave = () => {
      const exportData = {
        name: bracketName || "My Bracket",
        champion,
        choices,
        completedAt: new Date().toISOString(),
      };

      const stored = localStorage.getItem("marchMadnessBrackets");
      const brackets = stored ? JSON.parse(stored) : [];
      const newBracket = { ...exportData, id: Date.now().toString() };
      brackets.push(newBracket);
      localStorage.setItem("marchMadnessBrackets", JSON.stringify(brackets));

      navigate("/view", { state: { bracketData: newBracket } });
    };

    return (
      <div
        className="bracket-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>
          🏆 Tournament Champion 🏆
        </h1>
        <h2
          style={{
            fontSize: "4rem",
            color: champion.primaryColor,
            textShadow: "2px 2px 0 #fff",
          }}
        >
          {champion.name}
        </h2>
        <div style={{ margin: "2rem 0" }}>{renderTrait(champion)}</div>

        <input
          type="text"
          placeholder="Name your bracket..."
          value={bracketName}
          onChange={(e) => setBracketName(e.target.value)}
          style={{
            padding: "0.8rem 1rem",
            fontSize: "1.2rem",
            borderRadius: "8px",
            border: "1px solid #555",
            background: "#222",
            color: "#fff",
            marginBottom: "1rem",
            width: "300px",
            textAlign: "center",
          }}
        />

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "1rem 2rem",
              background: "#333",
              color: "#fff",
              fontSize: "1.2rem",
              borderRadius: "8px",
              cursor: "pointer",
              border: "1px solid #555",
            }}
          >
            Play Again
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "1rem 2rem",
              background: "#2563eb",
              color: "#fff",
              fontSize: "1.2rem",
              borderRadius: "8px",
              cursor: "pointer",
              border: "none",
            }}
          >
            Save & View Bracket
          </button>
        </div>
      </div>
    );
  }

  if (!activeMatchup) {
    return (
      <div
        className="bracket-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h2>Loading Bracket...</h2>
      </div>
    );
  }

  const roundNames = [
    "Play-In",
    "Round of 64",
    "Round of 32",
    "Sweet 16",
    "Elite 8",
    "Final Four",
    "National Championship",
  ];

  // Calculate progress
  const progressPercent =
    totalMatchups > 0 ? (choices.length / totalMatchups) * 100 : 0;

  return (
    <div className="bracket-container" style={{ position: "relative" }}>
      {/* Home Button */}
      <button
        onClick={() => {
          if (
            confirm(
              "Are you sure you want to exit? Your bracket progress will be lost.",
            )
          ) {
            navigate("/");
          }
        }}
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          zIndex: 20,
          background: "rgba(0,0,0,0.5)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          width: "80px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "1rem",
        }}
        title="Home"
      >
        Home
      </button>

      {/* Dev Skip Button */}
      <button
        onClick={handleDevSkip}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 20,
          background: "rgba(255,0,0,0.5)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "0.5rem 1rem",
          cursor: "pointer",
          fontSize: "1rem",
        }}
        title="Dev Skip"
      >
        Dev Skip
      </button>

      {/* Header info */}
      <div
        style={{
          position: "absolute",
          top: "2rem",
          left: "0",
          width: "100%",
          textAlign: "center",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <h3
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            opacity: 0.8,
          }}
        >
          {roundNames[activeMatchup.round]}
        </h3>
        <h2 style={{ fontSize: "2rem" }}>
          {activeMatchup.region?.toUpperCase()} Region
        </h2>
      </div>

      <>
        <div
          className={`bracket-half left-half ${selectedSide === "left" ? "expanded" : selectedSide === "right" ? "shrunk" : ""}`}
          onClick={() => handleSelection("left")}
          style={{ background: activeMatchup.teamA?.primaryColor || "#222" }}
        >
          <div className="content">{renderTrait(activeMatchup.teamA)}</div>
        </div>

        <div
          className={`bracket-half right-half ${selectedSide === "right" ? "expanded" : selectedSide === "left" ? "shrunk" : ""}`}
          onClick={() => handleSelection("right")}
          style={{ background: activeMatchup.teamB?.primaryColor || "#111" }}
        >
          <div className="content">{renderTrait(activeMatchup.teamB)}</div>
        </div>

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#fff",
            color: "#000",
            padding: "0.5rem 1rem",
            borderRadius: "20px",
            fontWeight: "bold",
            zIndex: 10,
            opacity: selectedSide ? 0 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          VS
        </div>
      </>

      {/* Progress Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "8px",
          background: "rgba(255,255,255,0.2)",
          zIndex: 20,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPercent}%`,
            background: "#fff",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
