// Typings for Sejm API - Term 10 

export interface MP {
  id: number;
  firstLastName: string;
  firstName: string;
  lastName: string;
  club: string;
  active: boolean;
  districtName?: string;
  districtNum?: number;
  educationLevel?: string;
  birthDate?: string;
  birthLocation?: string;
  profession?: string;
}

export interface VotingListResponse {
  term: number;
  sitting: number;
  sittingDay: number;
  votingNumber: number;
  date: string; // ISO datetime
  title: string;
  description: string;
  topic?: string;
  yes?: number;
  no?: number;
  abstain?: number;
  notParticipating?: number;
  kind?: string;
}

export interface MPVote {
  MP: number; // The MP ID
  vote: "YES" | "NO" | "ABSTAIN" | "ABSENT" | "VOTE_VALID";
  listLog?: string;
}

export interface VotingDetailResponse extends VotingListResponse {
  votes: MPVote[];
}
