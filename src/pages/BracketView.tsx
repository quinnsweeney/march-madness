import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import teamsData from "../teams.json";
import type { Team } from "../types";

type Matchup = {
  id: string;
  teamA: Team | null;
  teamB: Team | null;
  nextMatchupId: string | null;
  isSubA: boolean;
  round: number;
  region: string | null;
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

// Reused Bracket structure helper
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

export default function BracketView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [matchups, setMatchups] = useState<Matchup[]>([]);

  const bracketData = location.state?.bracketData;
  const champion = bracketData?.champion;
  const choices = bracketData?.choices as { matchupId: string; winner: Team }[];

  useEffect(() => {
    if (!bracketData || !choices) return;

    // Reconstruct the bracket state
    let currentMatchups = buildBracket(teamsData);

    // Apply choices
    for (const choice of choices) {
      const m = currentMatchups.find((x) => x.id === choice.matchupId);
      if (m && m.nextMatchupId) {
        const nextIdx = currentMatchups.findIndex(
          (nx) => nx.id === m.nextMatchupId,
        );
        if (nextIdx > -1) {
          if (m.isSubA) {
            currentMatchups[nextIdx] = {
              ...currentMatchups[nextIdx],
              teamA: choice.winner,
            };
          } else {
            currentMatchups[nextIdx] = {
              ...currentMatchups[nextIdx],
              teamB: choice.winner,
            };
          }
        }
      }
    }
    setMatchups(currentMatchups);
  }, [bracketData, choices]);

  if (!bracketData) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: "1rem",
        }}
      >
        <h2>No bracket data found.</h2>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "0.5rem 1rem",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Go Home
        </button>
      </div>
    );
  }

  const renderMatchupNode = (m: Matchup) => {
    const choice = choices.find((c) => c.matchupId === m.id);
    const winnerId = choice?.winner.id;

    return (
      <div key={m.id} className="matchup-node">
        <div
          className={`matchup-team ${winnerId === m.teamA?.id ? "winner" : ""} ${!winnerId && m.teamA ? "" : winnerId && winnerId !== m.teamA?.id ? "loser" : ""}`}
        >
          {m.teamA ? (
            <>
              <span className="seed">{m.teamA.seed}</span>{" "}
              <span className="name">{m.teamA.name}</span>
            </>
          ) : (
            <span className="tbd">TBD</span>
          )}
        </div>
        <div
          className={`matchup-team ${winnerId === m.teamB?.id ? "winner" : ""} ${!winnerId && m.teamB ? "" : winnerId && winnerId !== m.teamB?.id ? "loser" : ""}`}
        >
          {m.teamB ? (
            <>
              <span className="seed">{m.teamB.seed}</span>{" "}
              <span className="name">{m.teamB.name}</span>
            </>
          ) : (
            <span className="tbd">TBD</span>
          )}
        </div>
      </div>
    );
  };

  const renderRegionList = (regionName: string) => {
    const rMatchups = matchups.filter((m) => m.region === regionName);
    // We want to align them in columns.
    // Round 1 (1-8), Round 2 (1-4), Round 3 (1-2), Round 4 (1)
    const getRound = (r: number) => rMatchups.filter((m) => m.round === r);

    return (
      <div className={`bracket-region ${regionName}`}>
        <h3 className="region-title">{regionName.toUpperCase()}</h3>
        <div className="region-rounds">
          <div className="round-col">{getRound(1).map(renderMatchupNode)}</div>
          <div className="round-col">{getRound(2).map(renderMatchupNode)}</div>
          <div className="round-col">{getRound(3).map(renderMatchupNode)}</div>
          <div className="round-col">{getRound(4).map(renderMatchupNode)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="bracket-view-container">
      <div className="top-bar">
        <button onClick={() => navigate("/")} className="home-btn">
          Home
        </button>
      </div>

      <div className="bracket-canvas">
        <div className="bracket-left">
          {renderRegionList("east")}
          {renderRegionList("south")}
        </div>
        <div className="bracket-center">
          <div className="final-four">
            <h3 className="region-title">FINAL FOUR</h3>
            <div className="final-four-matchups">
              {matchups.filter((m) => m.round === 5).map(renderMatchupNode)}
            </div>

            <h3 className="region-title" style={{ marginTop: "2rem" }}>
              CHAMPIONSHIP
            </h3>
            <div className="championship-matchup">
              {matchups.filter((m) => m.round === 6).map(renderMatchupNode)}
            </div>

            <div className="champion-node">
              <h3>CHAMPION</h3>
              <div
                className="winner"
                style={
                  champion
                    ? {
                        background: champion.primaryColor,
                        color: champion.secondaryColor || "#fff",
                      }
                    : {}
                }
              >
                {champion ? (
                  <>
                    <span className="name">{champion.name}</span>
                  </>
                ) : (
                  "TBD"
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bracket-right">
          {renderRegionList("west")}
          {renderRegionList("midwest")}
        </div>
      </div>
    </div>
  );
}
