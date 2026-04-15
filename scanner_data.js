/* ================================================================
   Shelby County / Memphis Scanner Frequency Database
   Source: RadioReference.com — Memphis and Shelby County
   Public Safety (P25) System ID 11715, updated Oct 2025
   System: Project 25 Phase II | Sysid: 9FD WACN: BEE00
   Control Freqs: 851–860 MHz band (800MHz digital trunked)
   ================================================================ */

const SCANNER_SYSTEM = {
  name: 'Memphis & Shelby County Public Safety (P25)',
  type: 'Project 25 Phase II',
  systemId: '9FD',
  wacn: 'BEE00',
  source: 'https://www.radioreference.com/db/sid/11715',
  sites: [
    { name: 'Shelby Co. Simulcast', freqs: '851.300 / 852.4125 / 853.9375c / 856.4625 / 859.4625c' },
    { name: 'Memphis Site',         freqs: '851.250 / 852.6625 / 856.7125 / 858.9625c / 859.9625c' },
    { name: 'Millington Simulcast', freqs: '851.425 / 852.325c / 853.625c / 853.8875c' },
  ],
  broadcastifyFeed: 'https://www.broadcastify.com/listen/feed/25712',
};

const TALKGROUPS = [
  // ─── MEMPHIS POLICE DEPARTMENT (MPD) ─────────────────────────────
  { dec: 3,    hex: '003', agency: 'MPD', tag: 'MPD AUSTIN PEAY',  desc: 'Austin Peay Station — Primary Dispatch',           cat: 'Law Dispatch', group: 'Memphis Police' },
  { dec: 5,    hex: '005', agency: 'MPD', tag: 'MPD CTC1',         desc: 'Austin Peay Station — Car-to-Car',                 cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 7,    hex: '007', agency: 'MPD', tag: 'MPD STATION B',    desc: 'Station B — Info / NCIC Checks',                   cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 9,    hex: '009', agency: 'MPD', tag: 'MPD CITYWIDE',     desc: 'Citywide All-Precincts Channel',                   cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 11,   hex: '00b', agency: 'MPD', tag: 'MPD TACT EVENT',   desc: 'Tactical Unit / Special Events',                   cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 13,   hex: '00d', agency: 'MPD', tag: 'MPD RAINS',        desc: 'Raines Station — Primary Dispatch',                cat: 'Law Dispatch', group: 'Memphis Police' },
  { dec: 15,   hex: '00f', agency: 'MPD', tag: 'MPD CTC2',         desc: 'Raines Station — Car-to-Car',                      cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 17,   hex: '011', agency: 'MPD', tag: 'MPD MT MORIAH',    desc: 'Mt. Moriah Station — Primary Dispatch',            cat: 'Law Dispatch', group: 'Memphis Police' },
  { dec: 19,   hex: '013', agency: 'MPD', tag: 'MPD CTC3',         desc: 'Mt. Moriah Station — Car-to-Car',                  cat: 'Law Talk',     group: 'Memphis Police' },
  { dec: 21,   hex: '015', agency: 'MPD', tag: 'MPD CRUMP',        desc: 'Crump Station — Primary Dispatch',                 cat: 'Law Dispatch', group: 'Memphis Police' },
  { dec: 23,   hex: '017', agency: 'MPD', tag: 'MPD CTC4',         desc: 'Crump Station — Car-to-Car',                       cat: 'Law Talk',     group: 'Memphis Police' },
  { dec: 25,   hex: '019', agency: 'MPD', tag: 'MPD TILLMAN',      desc: 'Tillman Station — Primary Dispatch',               cat: 'Law Dispatch', group: 'Memphis Police' },
  { dec: 27,   hex: '01b', agency: 'MPD', tag: 'MPD CTC5',         desc: 'Tillman Station — Car-to-Car',                     cat: 'Law Talk',     group: 'Memphis Police' },
  { dec: 29,   hex: '01d', agency: 'MPD', tag: 'MPD NORTH MAIN',   desc: 'North Main Station — Primary Dispatch',            cat: 'Law Dispatch', group: 'Memphis Police' },
  { dec: 31,   hex: '01f', agency: 'MPD', tag: 'MPD CTC6',         desc: 'North Main Station — Car-to-Car',                  cat: 'Law Talk',     group: 'Memphis Police' },
  { dec: 33,   hex: '021', agency: 'MPD', tag: 'MPD AIRWAYS',      desc: 'Airways Station — Primary Dispatch',               cat: 'Law Dispatch', group: 'Memphis Police' },
  { dec: 35,   hex: '023', agency: 'MPD', tag: 'MPD CTC7',         desc: 'Airways Station — Car-to-Car',                     cat: 'Law Talk',     group: 'Memphis Police' },
  { dec: 37,   hex: '025', agency: 'MPD', tag: 'MPD APPLING FARMS',desc: 'Appling Farms Station — Primary Dispatch',         cat: 'Law Dispatch', group: 'Memphis Police' },
  { dec: 39,   hex: '027', agency: 'MPD', tag: 'MPD CTC8',         desc: 'Appling Farms Station — Car-to-Car',               cat: 'Law Talk',     group: 'Memphis Police' },
  { dec: 41,   hex: '029', agency: 'MPD', tag: 'MPD TRAFFIC',      desc: 'Traffic Division — Primary Dispatch',              cat: 'Law Dispatch', group: 'Memphis Police' },
  { dec: 43,   hex: '02b', agency: 'MPD', tag: 'MPD CTC9',         desc: 'Traffic Division — Car-to-Car',                    cat: 'Law Talk',     group: 'Memphis Police' },
  { dec: 45,   hex: '02d', agency: 'MPD', tag: 'MPD TRAINING 1',   desc: 'Training Channel 1',                               cat: 'Law Talk',     group: 'Memphis Police' },
  { dec: 47,   hex: '02f', agency: 'MPD', tag: 'MPD TRAINING 2',   desc: 'Training Channel 2',                               cat: 'Law Talk',     group: 'Memphis Police' },
  { dec: 53,   hex: '035', agency: 'MPD', tag: 'MPD IAB1',         desc: 'Internal Affairs Bureau — Channel 1',              cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 59,   hex: '03b', agency: 'MPD', tag: 'MPD ADMIN',        desc: 'MPD Administration',                               cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 337,  hex: '151', agency: 'MPD', tag: 'MPD DTF',          desc: 'Drug Task Force',                                  cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 339,  hex: '153', agency: 'MPD', tag: 'MPD RIDGEWAY',     desc: 'Ridgeway Station — Primary Dispatch',              cat: 'Law Dispatch', group: 'Memphis Police' },
  { dec: 341,  hex: '155', agency: 'MPD', tag: 'MPD CTC10',        desc: 'Ridgeway Station — Car-to-Car',                    cat: 'Law Talk',     group: 'Memphis Police' },
  { dec: 365,  hex: '16d', agency: 'MPD', tag: 'MPD CAT1',         desc: 'Metro Gang Task Force 1',                          cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 367,  hex: '16f', agency: 'MPD', tag: 'MPD PSN',          desc: 'Project Safe Neighborhood',                        cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 383,  hex: '17f', agency: 'MPD', tag: 'MPD MAYOR',        desc: 'Mayor Protection Detail',                          cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 443,  hex: '1bb', agency: 'MPD', tag: 'MPD Talk 1',       desc: 'Police Car-to-Car Channel 1',                      cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 445,  hex: '1bd', agency: 'MPD', tag: 'MPD Talk 2',       desc: 'Police Car-to-Car Channel 2',                      cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 447,  hex: '1bf', agency: 'MPD', tag: 'MPD Talk 3',       desc: 'Police Car-to-Car Channel 3',                      cat: 'Law Tac',      group: 'Memphis Police' },
  { dec: 449,  hex: '1c1', agency: 'MPD', tag: 'MPD Talk 4',       desc: 'Police Car-to-Car Channel 4',                      cat: 'Law Tac',      group: 'Memphis Police' },

  // ─── SHELBY COUNTY SHERIFF (SO) ──────────────────────────────────
  { dec: 3461, hex: 'd85', agency: 'SO',  tag: 'SO DISPATCH 1',    desc: 'Sheriff Dispatch — Primary SO1',                   cat: 'Law Dispatch', group: 'Shelby Co. Sheriff' },
  { dec: 3463, hex: 'd87', agency: 'SO',  tag: 'SO DISPATCH 2',    desc: 'Sheriff Dispatch — Secondary SO2',                 cat: 'Law Dispatch', group: 'Shelby Co. Sheriff' },
  { dec: 3465, hex: 'd89', agency: 'SO',  tag: 'SO DISPATCH 3',    desc: 'Sheriff Dispatch — SO3',                           cat: 'Law Dispatch', group: 'Shelby Co. Sheriff' },
  { dec: 3467, hex: 'd8b', agency: 'SO',  tag: 'SO SA DISPATCH 4', desc: 'Special Assignment Dispatch SO4',                  cat: 'Law Dispatch', group: 'Shelby Co. Sheriff' },
  { dec: 3469, hex: 'd8d', agency: 'SO',  tag: 'SO SA DISPATCH 5', desc: 'Special Assignment Dispatch SO5',                  cat: 'Law Dispatch', group: 'Shelby Co. Sheriff' },
  { dec: 3471, hex: 'd8f', agency: 'SO',  tag: 'SO INFO',          desc: 'Info Station / NCIC Checks',                       cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3313, hex: 'cf1', agency: 'SO',  tag: 'SO WARRANTS',      desc: 'Warrants Team',                                    cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3315, hex: 'cf3', agency: 'SO',  tag: 'SO TRAFFIC',       desc: 'Traffic Enforcement',                              cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3317, hex: 'cf5', agency: 'SO',  tag: 'SO COURT1',        desc: 'Court Operations 1',                               cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3319, hex: 'cf7', agency: 'SO',  tag: 'SO COURT2',        desc: 'Court Operations 2',                               cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3321, hex: 'cf9', agency: 'SO',  tag: 'SO COURT3',        desc: 'Court Operations 3',                               cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3327, hex: 'cff', agency: 'SO',  tag: 'SO FACILITIES 1',  desc: 'Facility Deputy Dispatch',                         cat: 'Law Dispatch', group: 'Shelby Co. Sheriff' },
  { dec: 3329, hex: 'd01', agency: 'SO',  tag: 'SO CAR TO CAR 1',  desc: 'Car-to-Car Channel 1',                             cat: 'Law Talk',     group: 'Shelby Co. Sheriff' },
  { dec: 3331, hex: 'd03', agency: 'SO',  tag: 'SO CAR TO CAR 2',  desc: 'Car-to-Car Channel 2',                             cat: 'Law Talk',     group: 'Shelby Co. Sheriff' },
  { dec: 3333, hex: 'd05', agency: 'SO',  tag: 'SO CAR TO CAR 3',  desc: 'Car-to-Car Channel 3',                             cat: 'Law Talk',     group: 'Shelby Co. Sheriff' },
  { dec: 3335, hex: 'd07', agency: 'SO',  tag: 'SO CAR TO CAR 4',  desc: 'Car-to-Car Channel 4',                             cat: 'Law Talk',     group: 'Shelby Co. Sheriff' },
  { dec: 3345, hex: 'd11', agency: 'SO',  tag: 'SO TAC1',          desc: 'Tactical Operations 1',                            cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3347, hex: 'd13', agency: 'SO',  tag: 'SO TAC2',          desc: 'Tactical Operations 2',                            cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3349, hex: 'd15', agency: 'SO',  tag: 'SO TAC3',          desc: 'Tactical Operations 3',                            cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3353, hex: 'd19', agency: 'SO',  tag: 'SO SWAT 1',        desc: 'SWAT Team — Primary Channel',                     cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3357, hex: 'd1d', agency: 'SO',  tag: 'SO BOMB',          desc: 'Bomb Squad',                                       cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3359, hex: 'd1f', agency: 'SO',  tag: 'SO GANG1',         desc: 'Metro Gang Task Force 1',                          cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3361, hex: 'd21', agency: 'SO',  tag: 'SO GANG2',         desc: 'Metro Gang Task Force 2',                          cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3369, hex: 'd29', agency: 'SO',  tag: 'HOMELAND SEC',     desc: 'Homeland Security',                                cat: 'Emergency Ops',group: 'Shelby Co. Sheriff' },
  { dec: 3389, hex: 'd3d', agency: 'SO',  tag: 'SO ADMIN',         desc: 'Sheriff Administration',                           cat: 'Law Talk',     group: 'Shelby Co. Sheriff' },
  { dec: 3473, hex: 'd91', agency: 'SO',  tag: 'SC EMERGENCY 1',   desc: 'County Emergency Backup 1',                        cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },
  { dec: 3475, hex: 'd93', agency: 'SO',  tag: 'SC EMERGENCY 2',   desc: 'County Emergency Backup 2',                        cat: 'Law Tac',      group: 'Shelby Co. Sheriff' },

  // ─── CORRECTIONS ─────────────────────────────────────────────────
  { dec: 3377, hex: 'd31', agency: 'JAIL', tag: 'SCCJAIL1',        desc: 'Shelby County Jail — Channel 1',                   cat: 'Corrections',  group: 'Corrections' },
  { dec: 3379, hex: 'd33', agency: 'JAIL', tag: 'SCCJAIL2',        desc: 'Shelby County Jail — Channel 2',                   cat: 'Corrections',  group: 'Corrections' },
  { dec: 3381, hex: 'd35', agency: 'JAIL', tag: 'SCCJAIL3',        desc: 'Shelby County Jail — Channel 3',                   cat: 'Corrections',  group: 'Corrections' },
  { dec: 3383, hex: 'd37', agency: 'JAIL', tag: 'SCC JAILOPS',     desc: 'Jail Operations',                                  cat: 'Corrections',  group: 'Corrections' },
  { dec: 3385, hex: 'd39', agency: 'JAIL', tag: 'SCC JAILEAST',    desc: 'Jail East Facility',                               cat: 'Corrections',  group: 'Corrections' },
  { dec: 3387, hex: 'd3b', agency: 'JAIL', tag: 'SCC JAILADMIN',   desc: 'Jail Administration',                              cat: 'Corrections',  group: 'Corrections' },
  { dec: 3427, hex: 'd63', agency: 'JAIL', tag: 'CORRECTIONS 1',   desc: 'Corrections Channel 1',                            cat: 'Corrections',  group: 'Corrections' },
  { dec: 3429, hex: 'd65', agency: 'JAIL', tag: 'CORRECTIONS 2',   desc: 'Corrections Channel 2',                            cat: 'Corrections',  group: 'Corrections' },
  { dec: 3431, hex: 'd67', agency: 'JAIL', tag: 'CORRECTIONS 3',   desc: 'Corrections Channel 3',                            cat: 'Corrections',  group: 'Corrections' },

  // ─── MEMPHIS FIRE DEPARTMENT (MFD) ───────────────────────────────
  { dec: 63,   hex: '03f', agency: 'MFD', tag: 'MFD DISPATCH 1',  desc: 'Memphis Fire — Dispatch 1',                        cat: 'Fire Dispatch', group: 'Memphis Fire' },
  { dec: 65,   hex: '041', agency: 'MFD', tag: 'MFD DISPATCH 2',  desc: 'Memphis Fire — Dispatch 2',                        cat: 'Fire Dispatch', group: 'Memphis Fire' },
  { dec: 79,   hex: '04f', agency: 'MFD', tag: 'MFD GRD1',        desc: 'Fireground Channel 1 (A05)',                       cat: 'Fire-Tac',      group: 'Memphis Fire' },
  { dec: 81,   hex: '051', agency: 'MFD', tag: 'MFD GRD2',        desc: 'Fireground Channel 2 (A06)',                       cat: 'Fire-Tac',      group: 'Memphis Fire' },
  { dec: 83,   hex: '053', agency: 'MFD', tag: 'MFD GRD3',        desc: 'Fireground Channel 3 (A07)',                       cat: 'Fire-Tac',      group: 'Memphis Fire' },
  { dec: 191,  hex: '0bf', agency: 'MFD', tag: 'MFD RIT OPS',     desc: 'Rapid Intervention Team',                          cat: 'Fire-Tac',      group: 'Memphis Fire' },
  { dec: 173,  hex: '0ad', agency: 'MFD', tag: 'MFD ARSON',       desc: 'Arson Investigations',                             cat: 'Fire-Tac',      group: 'Memphis Fire' },

  // ─── SHELBY COUNTY FIRE DEPT (SCFD) ──────────────────────────────
  { dec: 3433, hex: 'd69', agency: 'SCFD', tag: 'SCFD DISPATCH 1', desc: 'Shelby County Fire — Dispatch 1',                 cat: 'Fire Dispatch', group: 'SC Fire' },
  { dec: 3435, hex: 'd6b', agency: 'SCFD', tag: 'SCFD DISPATCH 2', desc: 'Shelby County Fire — Dispatch 2',                 cat: 'Fire Dispatch', group: 'SC Fire' },
  { dec: 3439, hex: 'd6f', agency: 'SCFD', tag: 'SCFD-GRD31',     desc: 'Fireground 31 (T4)',                               cat: 'Fire-Tac',      group: 'SC Fire' },
  { dec: 3441, hex: 'd71', agency: 'SCFD', tag: 'SCFD-GRD32',     desc: 'Fireground 32 (T5)',                               cat: 'Fire-Tac',      group: 'SC Fire' },
  { dec: 3443, hex: 'd73', agency: 'SCFD', tag: 'SCFD-GRD33',     desc: 'Fireground 33 (T6)',                               cat: 'Fire-Tac',      group: 'SC Fire' },

  // ─── EMS ──────────────────────────────────────────────────────────
  { dec: 67,   hex: '043', agency: 'EMS',  tag: 'MEMS DISPATCH 1', desc: 'Memphis EMS — Primary Dispatch',                  cat: 'EMS Dispatch',  group: 'EMS' },
  { dec: 69,   hex: '045', agency: 'EMS',  tag: 'MEMS DISPATCH 2', desc: 'Memphis EMS — Secondary Dispatch',                cat: 'EMS Dispatch',  group: 'EMS' },
  { dec: 3437, hex: 'd6d', agency: 'EMS',  tag: 'SCEMS DISPATCH',  desc: 'Shelby County EMS Dispatch',                      cat: 'EMS Dispatch',  group: 'EMS' },
  { dec: 143,  hex: '08f', agency: 'EMS',  tag: 'EMS BAPTC',       desc: 'Baptist Central Hospital ER',                     cat: 'Hospital',      group: 'EMS' },
  { dec: 145,  hex: '091', agency: 'EMS',  tag: 'EMS BAPTE',       desc: 'Baptist East Hospital ER',                        cat: 'Hospital',      group: 'EMS' },
  { dec: 151,  hex: '097', agency: 'EMS',  tag: 'EMS LBOHN',       desc: 'Le Bonheur Childrens Hospital ER',               cat: 'Hospital',      group: 'EMS' },

  // ─── EMERGENCY OPS / EMA ─────────────────────────────────────────
  { dec: null, hex: null, agency: 'EMA', tag: 'M-SC EMA Disp 1',  desc: 'Memphis/SC Emergency Mgmt — Primary Dispatch',    cat: 'Emergency Ops', group: 'Emergency Mgmt',
    freq: '155.895', pl: '156.7 PL', mode: 'FMN', license: 'KZJ931' },
  { dec: null, hex: null, agency: 'EMA', tag: 'M-SC EMA Disp 2',  desc: 'Memphis/SC Emergency Mgmt — Secondary Dispatch',  cat: 'Emergency Ops', group: 'Emergency Mgmt',
    freq: '154.995', pl: '156.7 PL', mode: 'FMN', license: 'KZJ931' },
  { dec: null, hex: null, agency: 'EMA', tag: 'Shelby EMS Page',  desc: 'Fire Primary Battalion / Ambulance Paging',       cat: 'Fire Dispatch', group: 'Emergency Mgmt',
    freq: '154.235', pl: '192.8 PL', mode: 'FMN', license: 'WNQR390' },

  // ─── OTHER LAW ENFORCEMENT ───────────────────────────────────────
  { dec: 3071, hex: 'bff', agency: 'MILL', tag: 'MILLINGTON PD 1', desc: 'Millington Police — Dispatch',                    cat: 'Law Dispatch',  group: 'Other LE' },
  { dec: 3073, hex: 'c01', agency: 'MILL', tag: 'MILLINGTON PD 2', desc: 'Millington Police — Car-to-Car',                  cat: 'Law Talk',      group: 'Other LE' },
  { dec: null, hex: null,  agency: 'COLL', tag: 'Collier PoliceBU', desc: 'Collierville Police (Backup)',                   cat: 'Law Tac',       group: 'Other LE',
    freq: '460.050', pl: '114.8 PL', mode: 'FMN', license: 'KKC879' },
  { dec: null, hex: null,  agency: 'GTPD', tag: 'Grmntwn Police',  desc: 'Germantown Police — Dispatch',                    cat: 'Law Dispatch',  group: 'Other LE',
    freq: '852.2125', pl: '293 NAC', mode: 'P25', license: 'WQOG812' },
  { dec: null, hex: null,  agency: 'BART', tag: 'Bart Police B/U', desc: 'Bartlett Police — Backup Repeater',               cat: 'Law Dispatch',  group: 'Other LE',
    freq: '854.4375', pl: '205 DPL', mode: 'FMN', license: 'WQLC743' },
  { dec: null, hex: null,  agency: 'MILL', tag: 'MillingtonPolice', desc: 'Millington Police — Dispatch (VHF)',              cat: 'Law Dispatch',  group: 'Other LE',
    freq: '154.875', pl: '167.9 PL', mode: 'FMN', license: 'KIG726' },
  { dec: 223,  hex: '0df', agency: 'EMRG', tag: 'EMRG1 PD',       desc: 'Police Emergency Backup 1 (Countywide)',           cat: 'Law Talk',      group: 'Emergency Backup' },
  { dec: 225,  hex: '0e1', agency: 'EMRG', tag: 'EMRG2 PD',       desc: 'Police Emergency Backup 2',                       cat: 'Law Talk',      group: 'Emergency Backup' },
  { dec: 227,  hex: '0e3', agency: 'EMRG', tag: 'EMRG3 PD',       desc: 'Police Emergency Backup 3',                       cat: 'Law Talk',      group: 'Emergency Backup' },
  { dec: 229,  hex: '0e5', agency: 'EMRG', tag: 'EMRG4 PD',       desc: 'Police Emergency Backup 4',                       cat: 'Law Talk',      group: 'Emergency Backup' },
  { dec: 231,  hex: '0e7', agency: 'EMRG', tag: 'EMRG5 PD',       desc: 'Police Emergency Backup 5',                       cat: 'Law Talk',      group: 'Emergency Backup' },

  // ─── CRITTENDEN COUNTY, AR (AWIN P25, Sysid 188) ─────────────
  { dec: 20201, hex: null, agency: 'CRIT', tag: 'CRIT SO',          desc: 'Sheriff: Dispatch',                                cat: 'Law Dispatch',  group: 'Crittenden Co AR' },
  { dec: 20202, hex: null, agency: 'CRIT', tag: 'Crit Shrf Tac',    desc: 'Sheriff: Tactical',                                cat: 'Law Tac',       group: 'Crittenden Co AR' },
  { dec: 20205, hex: null, agency: 'CRIT', tag: 'CritShrf SpecEnf', desc: 'Sheriff: Special Enforcement',                    cat: 'Law Tac',       group: 'Crittenden Co AR' },
  { dec: 20207, hex: null, agency: 'CRIT', tag: 'CritShrf Pursuit', desc: 'Sheriff: Pursuit',                                cat: 'Law Tac',       group: 'Crittenden Co AR' },
  { dec: 20208, hex: null, agency: 'MARP', tag: 'MARION PD 1',      desc: 'Marion Police: Dispatch',                         cat: 'Law Dispatch',  group: 'Crittenden Co AR' },
  { dec: 20210, hex: null, agency: 'CRIT', tag: 'CRIT Sec',         desc: 'Sheriff: Secondary (Earle, Jericho, Turrell PD)',  cat: 'Law Dispatch',  group: 'Crittenden Co AR' },
  { dec: 20211, hex: null, agency: 'MARF', tag: 'MARION FD 1',      desc: 'Marion Fire: Dispatch',                           cat: 'Fire Dispatch', group: 'Crittenden Co AR' },
  { dec: 20214, hex: null, agency: 'CEMS', tag: 'CRIT EMS',         desc: 'Crittenden EMS: Dispatch',                        cat: 'EMS Dispatch',  group: 'Crittenden Co AR' },
  { dec: 53745, hex: null, agency: 'WMFD', tag: 'W Mem Fire Disp',  desc: 'West Memphis Fire: Dispatch',                     cat: 'Fire Dispatch', group: 'Crittenden Co AR' },
  { dec: 53747, hex: null, agency: 'WMFD', tag: 'W Mem Fireground', desc: 'West Memphis: Fireground',                        cat: 'Fire-Tac',      group: 'Crittenden Co AR' },
  { dec: 53758, hex: null, agency: 'WMPD', tag: 'W Mem Police',     desc: 'West Memphis Police: Dispatch',                   cat: 'Law Dispatch',  group: 'Crittenden Co AR' },
  { dec: 53762, hex: null, agency: 'WMPD', tag: 'W Mem Police T/A', desc: 'West Memphis Police: Talkaround',                 cat: 'Law Tac',       group: 'Crittenden Co AR' },
  { dec: 53823, hex: null, agency: 'WMOEM',tag: 'WestMemphis OEM1', desc: 'West Memphis Emergency Management 1',             cat: 'Emergency Ops', group: 'Crittenden Co AR' },
  { dec: 20206, hex: null, agency: 'CEMS', tag: 'CRIT ER',          desc: 'Patient Reports to Nearby ERs',                   cat: 'Hospital',      group: 'Crittenden Co AR' },

  // ─── FAYETTE COUNTY, TN (Conventional / NXDN) ────────────────
  { dec: null, hex: null, agency: 'FAYFD', tag: 'Fayette Fire',    desc: 'Fire: Dispatch - Countywide',                     cat: 'Fire Dispatch', group: 'Fayette Co TN',
    freq: '154.220', mode: 'FMN' },
  { dec: null, hex: null, agency: 'SVRPD', tag: 'Somerville PD',   desc: 'Somerville Police',                               cat: 'Law Dispatch',  group: 'Fayette Co TN',
    freq: '460.175', mode: 'FMN' },
  { dec: null, hex: null, agency: 'PIPD',  tag: 'Piperton PD',     desc: 'Piperton Police: Dispatch',                       cat: 'Law Dispatch',  group: 'Fayette Co TN',
    freq: '453.100', mode: 'FMN' },
  { dec: null, hex: null, agency: 'RSVPD', tag: 'Rossville PD',    desc: 'Rossville Police: Primary',                       cat: 'Law Dispatch',  group: 'Fayette Co TN',
    freq: '453.625', mode: 'FMN' },
  { dec: null, hex: null, agency: 'PIPFD', tag: 'Piperton Fire',   desc: 'Piperton Fire: Dispatch',                         cat: 'Fire Dispatch', group: 'Fayette Co TN',
    freq: '460.625', mode: 'FMN' },

  // ─── TIPTON COUNTY, TN (Conventional analog backup) ──────────
  { dec: null, hex: null, agency: 'TCSO', tag: 'TCSO Dispatch',    desc: 'Sheriff: Analog Dispatch',                        cat: 'Law Dispatch',  group: 'Tipton Co TN',
    freq: '460.375', mode: 'FMN' },
  { dec: null, hex: null, agency: 'TCSO', tag: 'TCSO Police',      desc: 'All County Police: Analog Dispatch',              cat: 'Law Dispatch',  group: 'Tipton Co TN',
    freq: '460.075', mode: 'FMN' },
  { dec: null, hex: null, agency: 'TCFD', tag: 'TCFD Dispatch',    desc: 'Countywide Fire: Dispatch',                       cat: 'Fire Dispatch', group: 'Tipton Co TN',
    freq: '154.190', mode: 'FMN' },
  { dec: null, hex: null, agency: 'CVPD', tag: 'Covington PD',     desc: 'Covington Police: Dispatch',                      cat: 'Law Dispatch',  group: 'Tipton Co TN',
    freq: '460.225', mode: 'FMN' },
  { dec: null, hex: null, agency: 'CVFD', tag: 'Covington FD',     desc: 'Covington Fire: Dispatch',                        cat: 'Fire Dispatch', group: 'Tipton Co TN',
    freq: '154.145', mode: 'FMN' },
  { dec: null, hex: null, agency: 'MNFD', tag: 'Munford Fire',     desc: 'Munford Fire: Dispatch',                          cat: 'Fire Dispatch', group: 'Tipton Co TN',
    freq: '154.385', mode: 'FMN' },

  // ─── DESOTO COUNTY, MS (100% encrypted — notice rendered by scanner.js) ──
  // A single placeholder entry is needed so the group appears in GROUP_ORDER rendering.
  // scanner.js detects 'DeSoto Co MS' and renders an encryption notice instead of a table row.
  { dec: null, hex: null, agency: 'DESO', tag: 'ENCRYPTED', desc: 'DeSoto County — MSWIN P25 fully encrypted', cat: 'Info', group: 'DeSoto Co MS' },
];

// Group ordering for display
const GROUP_ORDER = [
  'Memphis Police',
  'Shelby Co. Sheriff',
  'Corrections',
  'Memphis Fire',
  'SC Fire',
  'EMS',
  'Emergency Mgmt',
  'Other LE',
  'Emergency Backup',
  'Crittenden Co AR',
  'Fayette Co TN',
  'Tipton Co TN',
  'DeSoto Co MS',
];

// Category color mapping
const CAT_COLORS = {
  'Law Dispatch': '#388bfd',
  'Law Tac':      '#79c0ff',
  'Law Talk':     '#58a6ff',
  'Fire Dispatch':'#f85149',
  'Fire-Tac':     '#ffa198',
  'EMS Dispatch': '#3fb950',
  'Hospital':     '#56d364',
  'Corrections':  '#e3b341',
  'Emergency Ops':'#f0883e',
  'Emergency Backup': '#8b949e',
  'Info':           '#6e7681',
};

// Agency badge colors
const AGENCY_COLORS = {
  'MPD':  { bg: 'rgba(56,139,253,0.18)', border: '#388bfd', text: '#79c0ff' },
  'SO':   { bg: 'rgba(255,185,0,0.15)',  border: '#d4a017', text: '#f0c040' },
  'MFD':  { bg: 'rgba(248,81,73,0.18)', border: '#f85149', text: '#ffa198' },
  'SCFD': { bg: 'rgba(248,81,73,0.12)', border: '#c9302c', text: '#ff7b72' },
  'EMS':  { bg: 'rgba(63,185,80,0.15)', border: '#3fb950', text: '#56d364' },
  'JAIL': { bg: 'rgba(227,179,65,0.15)',border: '#e3b341', text: '#e3b341' },
  'EMA':  { bg: 'rgba(240,136,62,0.15)',border: '#f0883e', text: '#ffa657' },
  'MILL': { bg: 'rgba(139,148,158,0.2)',border: '#8b949e', text: '#b1bac4' },
  'COLL': { bg: 'rgba(139,148,158,0.2)',border: '#8b949e', text: '#b1bac4' },
  'GTPD': { bg: 'rgba(139,148,158,0.2)',border: '#8b949e', text: '#b1bac4' },
  'BART': { bg: 'rgba(139,148,158,0.2)',border: '#8b949e', text: '#b1bac4' },
  'EMRG': { bg: 'rgba(139,148,158,0.15)',border: '#6e7681', text: '#8b949e' },
  // Crittenden County AR
  'CRIT': { bg: 'rgba(230,162,60,0.18)',  border: '#e6a23c', text: '#f0c070' },
  'MARP': { bg: 'rgba(230,162,60,0.14)',  border: '#c88a20', text: '#e6a23c' },
  'MARF': { bg: 'rgba(248,81,73,0.14)',   border: '#e6a23c', text: '#f0c070' },
  'CEMS': { bg: 'rgba(63,185,80,0.14)',   border: '#e6a23c', text: '#f0c070' },
  'WMFD': { bg: 'rgba(248,81,73,0.18)',   border: '#e6a23c', text: '#f0c070' },
  'WMPD': { bg: 'rgba(230,162,60,0.18)',  border: '#e6a23c', text: '#f0c070' },
  'WMOEM':{ bg: 'rgba(240,136,62,0.16)',  border: '#e6a23c', text: '#f0c070' },
  // Fayette County TN
  'FAYFD':{ bg: 'rgba(103,194,58,0.16)',  border: '#67c23a', text: '#8fd460' },
  'SVRPD':{ bg: 'rgba(103,194,58,0.14)',  border: '#4fa827', text: '#67c23a' },
  'PIPD': { bg: 'rgba(103,194,58,0.14)',  border: '#4fa827', text: '#67c23a' },
  'RSVPD':{ bg: 'rgba(103,194,58,0.14)',  border: '#4fa827', text: '#67c23a' },
  'PIPFD':{ bg: 'rgba(103,194,58,0.16)',  border: '#67c23a', text: '#8fd460' },
  // Tipton County TN
  'TCSO': { bg: 'rgba(144,147,153,0.18)', border: '#909399', text: '#b1b5bb' },
  'TCFD': { bg: 'rgba(144,147,153,0.18)', border: '#909399', text: '#b1b5bb' },
  'CVPD': { bg: 'rgba(144,147,153,0.18)', border: '#909399', text: '#b1b5bb' },
  'CVFD': { bg: 'rgba(144,147,153,0.18)', border: '#909399', text: '#b1b5bb' },
  'MNFD': { bg: 'rgba(144,147,153,0.18)', border: '#909399', text: '#b1b5bb' },
  // DeSoto County MS
  'DESO': { bg: 'rgba(245,108,108,0.15)', border: '#f56c6c', text: '#f89898' },
};

// P25 / Trunked system reference data
const P25_SYSTEMS = [
  {
    name: 'Shelby County P25',
    sysid: '9FD', wacn: 'BEE00',
    type: 'Project 25 Phase II',
    band: '800 MHz',
    sites: ['Shelby Co. Simulcast', 'Memphis Site', 'Millington Simulcast']
  },
  {
    name: 'AWIN (Arkansas)',
    sysid: '188', wacn: 'BEE00',
    type: 'Project 25 Phase II',
    band: '700/800 MHz',
    sites: ['Shell Lake (Crittenden)', 'West Memphis/Marion']
  },
  {
    name: 'MSWIN (Mississippi)',
    sysid: '2AD', wacn: 'BEE00',
    type: 'Project 25 Phase II (100% Encrypted)',
    band: '700/800 MHz',
    sites: ['Lewisburg (DeSoto)', 'DeSoto Co Simulcast'],
    note: 'All public safety talkgroups encrypted — not monitorable'
  }
];
