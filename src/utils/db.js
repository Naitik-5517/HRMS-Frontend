// Correct Vite import path
import { 
    SEED_USERS, 
    SEED_PROJECTS, 
    DEFAULT_INCENTIVE_CONFIG, 
    SEED_GUIDELINES 
} from "./constants.js";

const KEYS = {
    USERS: "app_users_v8",
    PROJECTS: "app_projects_v8",
    LOGS: "app_logs_v8",
    QC: "app_qc_v8",
    CONFIG: "app_config_v8",
    ROSTER: "app_roster_v8",
    GUIDELINES: "app_guidelines_v8",
    REQUESTS: "app_password_requests_v8",
};

class Database {
    constructor() {
        this.users = [];
        this.projects = [];
        this.logs = [];
        this.qcRecords = [];
        this.incentiveConfig = DEFAULT_INCENTIVE_CONFIG;
        this.roster = [];
        this.guidelines = [];
        this.passwordRequests = [];
        this.init();
    }

    safeParse(key, fallback) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            console.error(`Error parsing data for ${key}`, e);
            return fallback;
        }
    }

    init() {
        this.users = this.safeParse(KEYS.USERS, SEED_USERS);
        if (this.users.length === 0) { 
            this.users = SEED_USERS; 
            this.saveUsers(); 
        }

        this.projects = this.safeParse(KEYS.PROJECTS, SEED_PROJECTS);
        if (this.projects.length === 0) { 
            this.projects = SEED_PROJECTS; 
            this.saveProjects(); 
        }

        this.logs = this.safeParse(KEYS.LOGS, []);
        this.qcRecords = this.safeParse(KEYS.QC, []);
        this.incentiveConfig = this.safeParse(KEYS.CONFIG, DEFAULT_INCENTIVE_CONFIG);
        this.roster = this.safeParse(KEYS.ROSTER, []);
        this.guidelines = this.safeParse(KEYS.GUIDELINES, SEED_GUIDELINES);
        this.passwordRequests = this.safeParse(KEYS.REQUESTS, []);

        this.checkMigration();
    }

    checkMigration() {
        if (this.users.length > 0 && !this.users[0].email) {
            this.users = SEED_USERS;
            this.saveUsers();
        }
    }

    // ---------------------------
    // Persistence methods
    // ---------------------------

    saveUsers() { sessionStorage.setItem(KEYS.USERS, JSON.stringify(this.users)); }
    saveProjects() { sessionStorage.setItem(KEYS.PROJECTS, JSON.stringify(this.projects)); }
    saveLogs() { 
        sessionStorage.setItem(KEYS.LOGS, JSON.stringify(this.logs));
        window.dispatchEvent(new Event("db_update_logs"));
    }
    saveQC() { sessionStorage.setItem(KEYS.QC, JSON.stringify(this.qcRecords)); }
    saveConfig() { sessionStorage.setItem(KEYS.CONFIG, JSON.stringify(this.incentiveConfig)); }
    saveRoster() { sessionStorage.setItem(KEYS.ROSTER, JSON.stringify(this.roster)); }
    saveGuidelines() { sessionStorage.setItem(KEYS.GUIDELINES, JSON.stringify(this.guidelines)); }
    saveRequests() { sessionStorage.setItem(KEYS.REQUESTS, JSON.stringify(this.passwordRequests)); }

    // ---------------------------
    // Public API
    // ---------------------------

    // Users
    getUsers() { return this.users; }
    updateUsers(users) { this.users = users; this.saveUsers(); }

    // Projects
    getProjects() { return this.projects; }
    updateProjects(projects) { this.projects = projects; this.saveProjects(); }

    // Logs
    getLogs() { return this.logs; }
    addLog(log) { this.logs = [...this.logs, log]; this.saveLogs(); }

    // QC
    getQCRecords() { return this.qcRecords; }
    updateQCRecords(records) { this.qcRecords = records; this.saveQC(); }

    // Config
    getIncentiveConfig() { return this.incentiveConfig; }
    updateIncentiveConfig(config) { this.incentiveConfig = config; this.saveConfig(); }

    // Roster
    getRoster() { return this.roster; }
    updateRoster(entries) { this.roster = entries; this.saveRoster(); }

    // Guidelines
    getGuidelines() { return this.guidelines; }
    updateGuidelines(guidelines) { this.guidelines = guidelines; this.saveGuidelines(); }

    // Password Requests
    getPasswordRequests() { return this.passwordRequests; }
    addPasswordRequest(req) { 
        this.passwordRequests = [...this.passwordRequests, req]; 
        this.saveRequests(); 
    }
    resolvePasswordRequest(id) {
        this.passwordRequests = this.passwordRequests.map(r => 
            r.id === id ? { ...r, status: "RESOLVED" } : r
        );
        this.saveRequests();
    }

    // Reset DB
    reset() {
        Object.values(KEYS).forEach(k => sessionStorage.removeItem(k));
        window.location.reload();
    }
}

// export const db = new Database();

export default new Database();