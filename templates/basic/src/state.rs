use crate::StorageData;
use crate::MERKLE_MAP;
use core::slice::IterMut;
use zkwasm_rest_abi::Player;
use serde::Serialize;
use crate::settlement::SettlementInfo;

#[derive(Debug, Serialize)]
pub struct PlayerData {
    pub counter: u64,
}

impl Default for PlayerData {
    fn default() -> Self {
        Self {
            counter: 0
        }
    }
}

impl StorageData for PlayerData {
    fn from_data(u64data: &mut IterMut<u64>) -> Self {
        let counter = *u64data.next().unwrap();
        PlayerData {
            counter
        }
    }
    fn to_data(&self, data: &mut Vec<u64>) {
        data.push(self.counter);
    }
}

pub type HelloWorldPlayer = Player<PlayerData>;

#[derive (Serialize)]
pub struct State {
    counter: u64
}

impl State {
    pub fn get_state(pkey: Vec<u64>) -> String {
        let player = HelloWorldPlayer::get_from_pid(&HelloWorldPlayer::pkey_to_pid(&pkey.try_into().unwrap()));
        serde_json::to_string(&player).unwrap()
    }

    pub fn rand_seed() -> u64 {
        0
    }

    pub fn store() {
    }

    pub fn initialize() {
    }

    pub fn new() -> Self {
        State {
            counter: 0,
        }
    }

    pub fn snapshot() -> String {
        let state = unsafe { &STATE };
        serde_json::to_string(&state).unwrap()
    }

    pub fn preempt() -> bool {
        let state = unsafe {&STATE};
        return state.counter % 20 == 0;
    }

    pub fn flush_settlement() -> Vec<u8> {
        SettlementInfo::flush_settlement()
    }

    pub fn tick(&mut self) {
        self.counter += 1;
    }
}

pub static mut STATE: State  = State {
    counter: 0
};

pub struct Transaction {
    pub command: u64,
    pub nonce: u64,
    pub data: Vec<u64>,
}

const AUTOTICK: u64 = 0;
const INSTALL_PLAYER: u64 = 1;
const INC_COUNTER: u64 = 2;

const ERROR_PLAYER_ALREADY_EXIST:u32 = 1;
const ERROR_PLAYER_NOT_EXIST:u32 = 2;

impl Transaction {
    pub fn decode_error(e: u32) -> &'static str {
        match e {
           ERROR_PLAYER_NOT_EXIST => "PlayerNotExist",
           ERROR_PLAYER_ALREADY_EXIST => "PlayerAlreadyExist",
           _ => "Unknown"
        }
    }
    pub fn decode(params: &[u64]) -> Self {
        zkwasm_rust_sdk::dbg!("params {:?}\n", params);
        let command = params[0] & 0xff;
        let nonce = params[0] >> 16;
        let mut data = vec![];
        Transaction {
            command,
            nonce,
            data,
        }
    }
    pub fn install_player(&self, pkey: &[u64; 4]) -> Result<(), u32> {
        zkwasm_rust_sdk::dbg!("install \n");
        let pid = HelloWorldPlayer::pkey_to_pid(pkey);
        let player = HelloWorldPlayer::get_from_pid(&pid);
        match player {
            Some(_) => Err(ERROR_PLAYER_ALREADY_EXIST),
            None => {
                let player = HelloWorldPlayer::new_from_pid(pid);
                player.store();
                Ok(())
            }
        }
    }

    pub fn inc_counter(&self, _pkey: &[u64; 4]) -> Result<(), u32> {
        // Convert player's public key to player ID
        let pid = HelloWorldPlayer::pkey_to_pid(_pkey);
        // Try to get the player instance using the ID
        let player = HelloWorldPlayer::get_from_pid(&pid);

        // Match on the optional player result
        match player {
            // If player exists
            Some(mut p) => {
                // Increment the player's counter
                p.data.counter += 1;
                // Store the updated state
                p.store();
                // Return 0 to indicate success
                Ok(())
            },
            // If player doesn't exist, return error
            None => Err(ERROR_PLAYER_NOT_EXIST)
        }
    }

    pub fn process(&self, pkey: &[u64; 4], _rand: &[u64; 4]) -> Vec<u64> {
        let b = match self.command {
            AUTOTICK => {
                zkwasm_rust_sdk::dbg!("to run tick\n");
                unsafe {
                    STATE.tick();
                }
                0
            },
            INSTALL_PLAYER => self.install_player(pkey).map_or_else(|e| e, |_| 0),
            INC_COUNTER => self.inc_counter(pkey).map_or_else(|e| e, |_| 0),
            _ => {
                0
            }
        };
        vec![b as u64]
    }
}
