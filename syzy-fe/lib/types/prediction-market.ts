/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/prediction_market.json`.
 */
export type PredictionMarket = {
  "address": "HEmsoVhRJT4DRmGqZPk136eSLFPNRi6RmMqFNk4eJsVN",
  "metadata": {
    "name": "predictionMarket",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "acceptAuthority",
      "discriminator": [
        107,
        86,
        198,
        91,
        33,
        12,
        107,
        160
      ],
      "accounts": [
        {
          "name": "newAdmin",
          "writable": true,
          "signer": true
        },
        {
          "name": "globalConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "addLiquidity",
      "discriminator": [
        181,
        157,
        89,
        67,
        143,
        182,
        52,
        72
      ],
      "accounts": [
        {
          "name": "globalConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "teamWallet",
          "writable": true
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "yesToken"
              },
              {
                "kind": "account",
                "path": "noToken"
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "yesToken"
        },
        {
          "name": "noToken"
        },
        {
          "name": "userInfo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  105,
                  110,
                  102,
                  111
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimWinnings",
      "discriminator": [
        161,
        215,
        24,
        59,
        14,
        236,
        242,
        221
      ],
      "accounts": [
        {
          "name": "globalConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "yesToken"
              },
              {
                "kind": "account",
                "path": "noToken"
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "yesToken"
        },
        {
          "name": "noToken"
        },
        {
          "name": "userInfo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  105,
                  110,
                  102,
                  111
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": []
    },
    {
      "name": "claimWinningsV2",
      "docs": [
        "Claim winnings from a v1 market (fixed face-value payout, burns winning tokens)"
      ],
      "discriminator": [
        184,
        77,
        105,
        92,
        126,
        80,
        168,
        189
      ],
      "accounts": [
        {
          "name": "globalConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "yesMint"
              },
              {
                "kind": "account",
                "path": "noMint"
              }
            ]
          }
        },
        {
          "name": "marketV1Config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116,
                  95,
                  118,
                  49,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "yesMint",
          "writable": true
        },
        {
          "name": "noMint",
          "writable": true
        },
        {
          "name": "userWinningAta",
          "writable": true
        },
        {
          "name": "userInfo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  105,
                  110,
                  102,
                  111
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": []
    },
    {
      "name": "configure",
      "discriminator": [
        245,
        7,
        108,
        117,
        95,
        196,
        54,
        217
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "newConfig",
          "type": {
            "defined": {
              "name": "config"
            }
          }
        }
      ]
    },
    {
      "name": "createMarket",
      "discriminator": [
        103,
        226,
        97,
        235,
        200,
        188,
        251,
        254
      ],
      "accounts": [
        {
          "name": "globalConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "yesToken",
          "writable": true,
          "signer": true
        },
        {
          "name": "noToken"
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "yesToken"
              },
              {
                "kind": "account",
                "path": "noToken"
              }
            ]
          }
        },
        {
          "name": "clock",
          "docs": [
            "Clock for created_at timestamp"
          ],
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "globalYesTokenAccount",
          "writable": true
        },
        {
          "name": "globalNoAta",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "teamWallet",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createMarketParams"
            }
          }
        }
      ]
    },
    {
      "name": "createMarketV2",
      "docs": [
        "Create a v1 market with conditional token model (fixed face-value payouts)"
      ],
      "discriminator": [
        193,
        18,
        155,
        62,
        161,
        124,
        80,
        25
      ],
      "accounts": [
        {
          "name": "globalConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "yesToken",
          "writable": true,
          "signer": true
        },
        {
          "name": "noToken",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "yesToken"
              },
              {
                "kind": "account",
                "path": "noToken"
              }
            ]
          }
        },
        {
          "name": "marketV1Config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116,
                  95,
                  118,
                  49,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "globalYesAta",
          "writable": true
        },
        {
          "name": "globalNoAta",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "teamWallet",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createMarketV2Params"
            }
          }
        }
      ]
    },
    {
      "name": "depositCollateral",
      "docs": [
        "Deposit SOL collateral to mint equal YES+NO token pairs"
      ],
      "discriminator": [
        156,
        131,
        142,
        116,
        146,
        247,
        162,
        120
      ],
      "accounts": [
        {
          "name": "globalConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "yesMint"
              },
              {
                "kind": "account",
                "path": "noMint"
              }
            ]
          }
        },
        {
          "name": "marketV1Config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116,
                  95,
                  118,
                  49,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "yesMint",
          "writable": true
        },
        {
          "name": "noMint",
          "writable": true
        },
        {
          "name": "userYesAta",
          "writable": true
        },
        {
          "name": "userNoAta",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "deregisterTee",
      "docs": [
        "Deregister a TEE operator pubkey (admin only)"
      ],
      "discriminator": [
        205,
        240,
        4,
        255,
        67,
        221,
        50,
        50
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "globalConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "teeRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  101,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "operator",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initializeChildShard",
      "docs": [
        "Initialize a child shard with dynamic prefix (for manual shard creation)"
      ],
      "discriminator": [
        245,
        85,
        80,
        171,
        198,
        226,
        203,
        246
      ],
      "accounts": [
        {
          "name": "shard",
          "writable": true
        },
        {
          "name": "config",
          "docs": [
            "Config account for authority verification"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "poolIdentifier",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
        {
          "name": "prefixLen",
          "type": "u8"
        },
        {
          "name": "prefix",
          "type": {
            "array": [
              "u8",
              8
            ]
          }
        }
      ]
    },
    {
      "name": "initializeShard0",
      "docs": [
        "Initialize the first nullifier shard (prefix = [0])"
      ],
      "discriminator": [
        115,
        98,
        101,
        162,
        192,
        38,
        170,
        247
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "shard0",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeShard1",
      "docs": [
        "Initialize the second nullifier shard (prefix = [1])"
      ],
      "discriminator": [
        125,
        11,
        129,
        88,
        225,
        155,
        85,
        250
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "shard1",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeShieldedPool",
      "docs": [
        "Initialize a shielded pool for a prediction market"
      ],
      "discriminator": [
        255,
        153,
        109,
        198,
        182,
        107,
        0,
        109
      ],
      "accounts": [
        {
          "name": "market",
          "docs": [
            "The prediction market to link the shielded pool to"
          ],
          "writable": true
        },
        {
          "name": "shieldedPool",
          "docs": [
            "The shielded pool PDA"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "leavesIndexer",
          "docs": [
            "Leaves indexer PDA (for tracking batches)"
          ],
          "writable": true
        },
        {
          "name": "subtreeIndexer",
          "docs": [
            "Subtree indexer PDA (for tracking small trees)"
          ],
          "writable": true
        },
        {
          "name": "authority",
          "docs": [
            "Authority creating the pool (must be market creator or global admin)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "identifier",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        }
      ]
    },
    {
      "name": "initializeTeeRegistry",
      "docs": [
        "Initialize the TEE registry (admin only, one-time)"
      ],
      "discriminator": [
        242,
        223,
        18,
        234,
        159,
        214,
        115,
        201
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "globalConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "teeRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  101,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "mintNoToken",
      "discriminator": [
        198,
        161,
        208,
        188,
        122,
        69,
        236,
        128
      ],
      "accounts": [
        {
          "name": "globalConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "noToken",
          "writable": true,
          "signer": true
        },
        {
          "name": "globalNoTokenAccount",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "noSymbol",
          "type": "string"
        },
        {
          "name": "noUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "nominateAuthority",
      "discriminator": [
        148,
        182,
        144,
        91,
        186,
        12,
        118,
        18
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "globalConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "privateClaim",
      "docs": [
        "Private claim: claim winnings anonymously after resolution"
      ],
      "discriminator": [
        117,
        213,
        23,
        34,
        170,
        240,
        18,
        80
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "docs": [
            "The shielded pool"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "market",
          "docs": [
            "The prediction market (must be resolved)"
          ]
        },
        {
          "name": "nullifierShard",
          "docs": [
            "Nullifier shard for the token position commitment"
          ],
          "writable": true
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "docs": [
            "User submitting the proof"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "instructionAccount"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "dummy0Account",
          "writable": true
        },
        {
          "name": "dummy1Account",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "array": [
              "u8",
              256
            ]
          }
        },
        {
          "name": "publicInputs",
          "type": {
            "array": [
              "u8",
              113
            ]
          }
        }
      ]
    },
    {
      "name": "privateClaimV2",
      "docs": [
        "Private claim v2: auto-detects v0/v1 payout model"
      ],
      "discriminator": [
        93,
        109,
        119,
        78,
        49,
        171,
        141,
        237
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "docs": [
            "The shielded pool"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "market",
          "docs": [
            "The prediction market (must be resolved)"
          ]
        },
        {
          "name": "marketV1Config",
          "docs": [
            "If account has no data or wrong owner → v0 market (uses proportional payout)."
          ]
        },
        {
          "name": "nullifierShard",
          "docs": [
            "Nullifier shard for the token position commitment"
          ],
          "writable": true
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "docs": [
            "User submitting the proof"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "instructionAccount"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "dummy0Account",
          "writable": true
        },
        {
          "name": "dummy1Account",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "array": [
              "u8",
              256
            ]
          }
        },
        {
          "name": "publicInputs",
          "type": {
            "array": [
              "u8",
              113
            ]
          }
        }
      ]
    },
    {
      "name": "privateSell",
      "discriminator": [
        91,
        99,
        77,
        191,
        142,
        178,
        4,
        1
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "docs": [
            "The shielded pool"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "market",
          "docs": [
            "The prediction market (for AMM calculations)"
          ],
          "writable": true
        },
        {
          "name": "nullifierShard",
          "docs": [
            "Nullifier shard for the token note being spent"
          ],
          "writable": true
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "docs": [
            "User submitting the proof"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "instructionAccount"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "dummy0Account",
          "writable": true
        },
        {
          "name": "dummy1Account",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "array": [
              "u8",
              256
            ]
          }
        },
        {
          "name": "publicInputs",
          "type": {
            "array": [
              "u8",
              113
            ]
          }
        },
        {
          "name": "minSolOutput",
          "type": "u64"
        }
      ]
    },
    {
      "name": "privateShield",
      "docs": [
        "Shield (deposit) SOL into the private pool"
      ],
      "discriminator": [
        165,
        92,
        26,
        245,
        234,
        55,
        225,
        150
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "docs": [
            "The shielded pool to deposit into"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "depositor",
          "docs": [
            "The depositor (VIP whale)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "instructionAccount"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "array": [
              "u8",
              256
            ]
          }
        },
        {
          "name": "publicInputs",
          "type": {
            "array": [
              "u8",
              72
            ]
          }
        }
      ]
    },
    {
      "name": "privateShieldDouble",
      "docs": [
        "Shield (deposit) SOL with double-leaf (split deposit)"
      ],
      "discriminator": [
        217,
        22,
        188,
        162,
        172,
        7,
        239,
        186
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "depositor",
          "writable": true,
          "signer": true
        },
        {
          "name": "instructionAccount"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "array": [
              "u8",
              256
            ]
          }
        },
        {
          "name": "publicInputs",
          "type": {
            "array": [
              "u8",
              72
            ]
          }
        }
      ]
    },
    {
      "name": "privateSwap",
      "docs": [
        "Private swap: exchange shielded SOL for YES/NO tokens"
      ],
      "discriminator": [
        0,
        136,
        191,
        38,
        155,
        252,
        102,
        193
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "docs": [
            "The shielded pool"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "market",
          "docs": [
            "The prediction market (for AMM calculations)"
          ],
          "writable": true
        },
        {
          "name": "nullifierShard",
          "docs": [
            "Nullifier shard for the old SOL commitment"
          ],
          "writable": true
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "docs": [
            "User submitting the proof (can be anyone, including a relayer)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "instructionAccount"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "dummy0Account",
          "writable": true
        },
        {
          "name": "dummy1Account",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "array": [
              "u8",
              256
            ]
          }
        },
        {
          "name": "publicInputs",
          "type": {
            "array": [
              "u8",
              113
            ]
          }
        },
        {
          "name": "minTokenOutput",
          "type": "u64"
        }
      ]
    },
    {
      "name": "privateUnshield",
      "docs": [
        "Unshield (withdraw) SOL from the private pool"
      ],
      "discriminator": [
        136,
        119,
        53,
        211,
        234,
        38,
        77,
        70
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "docs": [
            "The shielded pool"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "nullifierShard",
          "docs": [
            "Nullifier shard for the SOL commitment"
          ],
          "writable": true
        },
        {
          "name": "user",
          "docs": [
            "The user withdrawing funds (must sign)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "instructionAccount"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "dummy0Account",
          "writable": true
        },
        {
          "name": "dummy1Account",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "array": [
              "u8",
              256
            ]
          }
        },
        {
          "name": "publicInputs",
          "type": {
            "array": [
              "u8",
              104
            ]
          }
        }
      ]
    },
    {
      "name": "privateUnshieldOnBehalf",
      "docs": [
        "Unshield on behalf (relayer-assisted withdrawal to any address)"
      ],
      "discriminator": [
        254,
        53,
        175,
        115,
        107,
        38,
        82,
        96
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "docs": [
            "The shielded pool"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "nullifierShard",
          "docs": [
            "Nullifier shard"
          ],
          "writable": true
        },
        {
          "name": "withdrawer",
          "writable": true
        },
        {
          "name": "payer",
          "docs": [
            "The relayer paying transaction fees (must sign)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "instructionAccount"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "dummy0Account",
          "writable": true
        },
        {
          "name": "dummy1Account",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "array": [
              "u8",
              256
            ]
          }
        },
        {
          "name": "publicInputs",
          "type": {
            "array": [
              "u8",
              104
            ]
          }
        }
      ]
    },
    {
      "name": "registerTee",
      "docs": [
        "Register a TEE operator pubkey (admin only)"
      ],
      "discriminator": [
        60,
        216,
        220,
        191,
        160,
        5,
        153,
        133
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "globalConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "teeRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  101,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "operator",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "resetShards",
      "docs": [
        "Reset nullifier shards (admin only)"
      ],
      "discriminator": [
        126,
        86,
        126,
        180,
        222,
        55,
        241,
        56
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "shard0",
          "docs": [
            "L5 FIX: PDA validation ensures shards belong to this pool"
          ],
          "writable": true
        },
        {
          "name": "shard1",
          "docs": [
            "L5 FIX: PDA validation ensures shards belong to this pool"
          ],
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "resolution",
      "discriminator": [
        149,
        113,
        222,
        19,
        243,
        191,
        14,
        10
      ],
      "accounts": [
        {
          "name": "globalConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "yesToken"
              },
              {
                "kind": "account",
                "path": "noToken"
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "yesToken"
        },
        {
          "name": "noToken"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "yesAmount",
          "type": "u64"
        },
        {
          "name": "noAmount",
          "type": "u64"
        },
        {
          "name": "tokenType",
          "type": "u8"
        },
        {
          "name": "isCompleted",
          "type": "bool"
        }
      ]
    },
    {
      "name": "resolveViaOracle",
      "docs": [
        "Resolve a market via Switchboard oracle feed (permissionless — anyone can call)"
      ],
      "discriminator": [
        111,
        135,
        45,
        223,
        89,
        204,
        7,
        139
      ],
      "accounts": [
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "yesToken"
              },
              {
                "kind": "account",
                "path": "noToken"
              }
            ]
          }
        },
        {
          "name": "yesToken"
        },
        {
          "name": "noToken"
        },
        {
          "name": "oracleFeed"
        },
        {
          "name": "payer",
          "docs": [
            "Anyone can call this instruction (permissionless resolution)"
          ],
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "setSp1Vkey",
      "docs": [
        "Set SP1 verification key hash (admin only)"
      ],
      "discriminator": [
        216,
        199,
        21,
        183,
        208,
        154,
        223,
        0
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "globalConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "vkeyHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "splitShard",
      "docs": [
        "Split a full nullifier shard into two child shards"
      ],
      "discriminator": [
        96,
        45,
        240,
        120,
        41,
        111,
        138,
        86
      ],
      "accounts": [
        {
          "name": "parentShard",
          "docs": [
            "The parent shard to split (will be closed)"
          ],
          "writable": true
        },
        {
          "name": "leftChild",
          "docs": [
            "Left child shard (prefix + 0)"
          ],
          "writable": true
        },
        {
          "name": "rightChild",
          "docs": [
            "Right child shard (prefix + 1)"
          ],
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "poolIdentifier",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
        {
          "name": "parentPrefixLen",
          "type": "u8"
        },
        {
          "name": "parentPrefix",
          "type": {
            "array": [
              "u8",
              8
            ]
          }
        }
      ]
    },
    {
      "name": "splitTokenNote",
      "docs": [
        "Split a token note into two smaller notes (for partial selling)"
      ],
      "discriminator": [
        203,
        68,
        245,
        93,
        150,
        107,
        248,
        180
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "docs": [
            "The shielded pool"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "nullifierShard",
          "docs": [
            "Nullifier shard for the token note being spent"
          ],
          "writable": true
        },
        {
          "name": "user",
          "docs": [
            "User submitting the proof"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "instructionAccount"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "dummy0Account",
          "writable": true
        },
        {
          "name": "dummy1Account",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "array": [
              "u8",
              256
            ]
          }
        },
        {
          "name": "publicInputs",
          "type": {
            "array": [
              "u8",
              153
            ]
          }
        }
      ]
    },
    {
      "name": "swap",
      "discriminator": [
        248,
        198,
        158,
        145,
        225,
        117,
        135,
        200
      ],
      "accounts": [
        {
          "name": "globalConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "teamWallet",
          "writable": true
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "yesToken"
              },
              {
                "kind": "account",
                "path": "noToken"
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "yesToken"
        },
        {
          "name": "noToken"
        },
        {
          "name": "globalYesAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "globalVault"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  238,
                  117,
                  143,
                  222,
                  24,
                  66,
                  93,
                  188,
                  228,
                  108,
                  205,
                  218,
                  182,
                  26,
                  252,
                  77,
                  131,
                  185,
                  13,
                  39,
                  254,
                  189,
                  249,
                  40,
                  216,
                  161,
                  139,
                  252
                ]
              },
              {
                "kind": "account",
                "path": "yesToken"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "globalNoAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "globalVault"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  238,
                  117,
                  143,
                  222,
                  24,
                  66,
                  93,
                  188,
                  228,
                  108,
                  205,
                  218,
                  182,
                  26,
                  252,
                  77,
                  131,
                  185,
                  13,
                  39,
                  254,
                  189,
                  249,
                  40,
                  216,
                  161,
                  139,
                  252
                ]
              },
              {
                "kind": "account",
                "path": "noToken"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "userYesAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  238,
                  117,
                  143,
                  222,
                  24,
                  66,
                  93,
                  188,
                  228,
                  108,
                  205,
                  218,
                  182,
                  26,
                  252,
                  77,
                  131,
                  185,
                  13,
                  39,
                  254,
                  189,
                  249,
                  40,
                  216,
                  161,
                  139,
                  252
                ]
              },
              {
                "kind": "account",
                "path": "yesToken"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "userNoAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  238,
                  117,
                  143,
                  222,
                  24,
                  66,
                  93,
                  188,
                  228,
                  108,
                  205,
                  218,
                  182,
                  26,
                  252,
                  77,
                  131,
                  185,
                  13,
                  39,
                  254,
                  189,
                  249,
                  40,
                  216,
                  161,
                  139,
                  252
                ]
              },
              {
                "kind": "account",
                "path": "noToken"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "userInfo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  105,
                  110,
                  102,
                  111
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "rewardPoolVault",
          "docs": [
            "Validated against global_config.reward_pool_vault."
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "direction",
          "type": "u8"
        },
        {
          "name": "tokenType",
          "type": "u8"
        },
        {
          "name": "minimumReceiveAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swapV2",
      "docs": [
        "Swap YES<->NO tokens in a v1 market (no SOL moves)"
      ],
      "discriminator": [
        43,
        4,
        237,
        11,
        26,
        201,
        30,
        98
      ],
      "accounts": [
        {
          "name": "globalConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "yesMint"
              },
              {
                "kind": "account",
                "path": "noMint"
              }
            ]
          }
        },
        {
          "name": "marketV1Config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116,
                  95,
                  118,
                  49,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "yesMint"
        },
        {
          "name": "noMint"
        },
        {
          "name": "userYesAta",
          "writable": true
        },
        {
          "name": "userNoAta",
          "writable": true
        },
        {
          "name": "globalYesAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "globalVault"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  238,
                  117,
                  143,
                  222,
                  24,
                  66,
                  93,
                  188,
                  228,
                  108,
                  205,
                  218,
                  182,
                  26,
                  252,
                  77,
                  131,
                  185,
                  13,
                  39,
                  254,
                  189,
                  249,
                  40,
                  216,
                  161,
                  139,
                  252
                ]
              },
              {
                "kind": "account",
                "path": "yesMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "globalNoAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "globalVault"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  238,
                  117,
                  143,
                  222,
                  24,
                  66,
                  93,
                  188,
                  228,
                  108,
                  205,
                  218,
                  182,
                  26,
                  252,
                  77,
                  131,
                  185,
                  13,
                  39,
                  254,
                  189,
                  249,
                  40,
                  216,
                  161,
                  139,
                  252
                ]
              },
              {
                "kind": "account",
                "path": "noMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minAmountOut",
          "type": "u64"
        },
        {
          "name": "buyYes",
          "type": "bool"
        }
      ]
    },
    {
      "name": "teeBatchClaim",
      "docs": [
        "TEE batch claim: SP1-verified batch claim of shielded winning notes"
      ],
      "discriminator": [
        95,
        180,
        17,
        145,
        244,
        160,
        253,
        55
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "docs": [
            "The shielded pool"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "market",
          "docs": [
            "The prediction market (must be resolved for claims)"
          ]
        },
        {
          "name": "marketV1Config"
        },
        {
          "name": "config",
          "docs": [
            "Global program config"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "teeRegistry",
          "docs": [
            "TEE registry — only registered operators can call this instruction"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  101,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "docs": [
            "TEE signer (must be registered in tee_registry)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": "bytes"
        },
        {
          "name": "publicValues",
          "type": "bytes"
        },
        {
          "name": "nNotes",
          "type": "u8"
        }
      ]
    },
    {
      "name": "teeBatchSell",
      "docs": [
        "TEE batch sell: SP1-verified batch sell of shielded token notes"
      ],
      "discriminator": [
        116,
        90,
        105,
        81,
        218,
        119,
        50,
        26
      ],
      "accounts": [
        {
          "name": "shieldedPool",
          "docs": [
            "The shielded pool"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  105,
                  101,
                  108,
                  100,
                  101,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "shielded_pool.market",
                "account": "shieldedMarketPool"
              }
            ]
          }
        },
        {
          "name": "market",
          "docs": [
            "The prediction market (must be active for sells)"
          ],
          "writable": true
        },
        {
          "name": "marketV1Config"
        },
        {
          "name": "config",
          "docs": [
            "Global program config (for fee BPS and sp1 vkey)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "teeRegistry",
          "docs": [
            "TEE registry — only registered operators can call this instruction"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  101,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "docs": [
            "TEE signer that submits the batch (must be registered in tee_registry)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": "bytes"
        },
        {
          "name": "publicValues",
          "type": "bytes"
        },
        {
          "name": "minSolOutput",
          "type": "u64"
        },
        {
          "name": "nNotes",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateMarket",
      "docs": [
        "Update market metadata fields (admin only)"
      ],
      "discriminator": [
        153,
        39,
        2,
        197,
        179,
        50,
        199,
        217
      ],
      "accounts": [
        {
          "name": "globalConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "yesToken"
              },
              {
                "kind": "account",
                "path": "noToken"
              }
            ]
          }
        },
        {
          "name": "yesToken"
        },
        {
          "name": "noToken"
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "updateMarketParams"
            }
          }
        }
      ]
    },
    {
      "name": "withdrawCollateral",
      "docs": [
        "Burn equal YES+NO tokens to withdraw SOL collateral"
      ],
      "discriminator": [
        115,
        135,
        168,
        106,
        139,
        214,
        138,
        150
      ],
      "accounts": [
        {
          "name": "globalConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "yesMint"
              },
              {
                "kind": "account",
                "path": "noMint"
              }
            ]
          }
        },
        {
          "name": "marketV1Config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116,
                  95,
                  118,
                  49,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "yesMint",
          "writable": true
        },
        {
          "name": "noMint",
          "writable": true
        },
        {
          "name": "userYesAta",
          "writable": true
        },
        {
          "name": "userNoAta",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "pairs",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawLiquidity",
      "discriminator": [
        149,
        158,
        33,
        185,
        47,
        243,
        253,
        31
      ],
      "accounts": [
        {
          "name": "globalConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "teamWallet",
          "writable": true
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "yesToken"
              },
              {
                "kind": "account",
                "path": "noToken"
              }
            ]
          }
        },
        {
          "name": "globalVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "yesToken"
        },
        {
          "name": "noToken"
        },
        {
          "name": "userInfo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  105,
                  110,
                  102,
                  111
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "bitShard",
      "discriminator": [
        207,
        56,
        234,
        182,
        39,
        51,
        204,
        94
      ]
    },
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "market",
      "discriminator": [
        219,
        190,
        213,
        55,
        0,
        227,
        198,
        154
      ]
    },
    {
      "name": "marketV1Config",
      "discriminator": [
        156,
        76,
        41,
        201,
        109,
        246,
        98,
        76
      ]
    },
    {
      "name": "shieldedMarketPool",
      "discriminator": [
        201,
        130,
        66,
        252,
        159,
        231,
        76,
        224
      ]
    },
    {
      "name": "teeRegistry",
      "discriminator": [
        162,
        146,
        204,
        38,
        164,
        220,
        177,
        22
      ]
    },
    {
      "name": "userInfo",
      "discriminator": [
        83,
        134,
        200,
        56,
        144,
        56,
        10,
        62
      ]
    }
  ],
  "events": [
    {
      "name": "completeEvent",
      "discriminator": [
        95,
        114,
        97,
        156,
        212,
        46,
        152,
        8
      ]
    },
    {
      "name": "createEvent",
      "discriminator": [
        27,
        114,
        169,
        77,
        222,
        235,
        99,
        118
      ]
    },
    {
      "name": "globalUpdateEvent",
      "discriminator": [
        153,
        69,
        19,
        7,
        115,
        232,
        248,
        248
      ]
    },
    {
      "name": "oracleResolutionEvent",
      "discriminator": [
        255,
        237,
        139,
        227,
        23,
        40,
        101,
        42
      ]
    },
    {
      "name": "swapFeeEvent",
      "discriminator": [
        85,
        226,
        67,
        47,
        182,
        177,
        13,
        148
      ]
    },
    {
      "name": "tradeEvent",
      "discriminator": [
        189,
        219,
        127,
        211,
        78,
        230,
        97,
        238
      ]
    },
    {
      "name": "withdrawEvent",
      "discriminator": [
        22,
        9,
        133,
        26,
        160,
        44,
        71,
        192
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "valueTooSmall",
      "msg": "valueTooSmall"
    },
    {
      "code": 6001,
      "name": "valueTooLarge",
      "msg": "valueTooLarge"
    },
    {
      "code": 6002,
      "name": "valueInvalid",
      "msg": "valueInvalid"
    },
    {
      "code": 6003,
      "name": "incorrectConfigAccount",
      "msg": "incorrectConfigAccount"
    },
    {
      "code": 6004,
      "name": "incorrectAuthority",
      "msg": "incorrectAuthority"
    },
    {
      "code": 6005,
      "name": "overflowOrUnderflowOccurred",
      "msg": "Overflow or underflow occured"
    },
    {
      "code": 6006,
      "name": "invalidAmount",
      "msg": "Amount is invalid"
    },
    {
      "code": 6007,
      "name": "incorrectTeamWallet",
      "msg": "Incorrect team wallet address"
    },
    {
      "code": 6008,
      "name": "curveNotCompleted",
      "msg": "Curve is not completed"
    },
    {
      "code": 6009,
      "name": "curveAlreadyCompleted",
      "msg": "Can not swap after the curve is completed"
    },
    {
      "code": 6010,
      "name": "mintAuthorityEnabled",
      "msg": "Mint authority should be revoked"
    },
    {
      "code": 6011,
      "name": "freezeAuthorityEnabled",
      "msg": "Freeze authority should be revoked"
    },
    {
      "code": 6012,
      "name": "returnAmountTooSmall",
      "msg": "Return amount is too small compared to the minimum received amount"
    },
    {
      "code": 6013,
      "name": "ammAlreadyExists",
      "msg": "AMM is already exist"
    },
    {
      "code": 6014,
      "name": "notInitialized",
      "msg": "Global Not Initialized"
    },
    {
      "code": 6015,
      "name": "invalidGlobalAuthority",
      "msg": "Invalid Global Authority"
    },
    {
      "code": 6016,
      "name": "notWhiteList",
      "msg": "This creator is not in whitelist"
    },
    {
      "code": 6017,
      "name": "incorrectLaunchPhase",
      "msg": "incorrectLaunchPhase"
    },
    {
      "code": 6018,
      "name": "insufficientTokens",
      "msg": "Not enough tokens to complete the sell order."
    },
    {
      "code": 6019,
      "name": "insufficientSol",
      "msg": "Not enough SOL received to be valid."
    },
    {
      "code": 6020,
      "name": "sellFailed",
      "msg": "Sell Failed"
    },
    {
      "code": 6021,
      "name": "buyFailed",
      "msg": "Buy Failed"
    },
    {
      "code": 6022,
      "name": "notBondingCurveMint",
      "msg": "This token is not a bonding curve token"
    },
    {
      "code": 6023,
      "name": "notSol",
      "msg": "Not quote mint"
    },
    {
      "code": 6024,
      "name": "invalidMigrationAuthority",
      "msg": "Invalid Migration Authority"
    },
    {
      "code": 6025,
      "name": "notCompleted",
      "msg": "Bonding curve is not completed"
    },
    {
      "code": 6026,
      "name": "invalidMeteoraProgram",
      "msg": "Invalid Meteora Program"
    },
    {
      "code": 6027,
      "name": "arithmeticError",
      "msg": "Arithmetic Error"
    },
    {
      "code": 6028,
      "name": "invalidParameter",
      "msg": "Invalid Parameter"
    },
    {
      "code": 6029,
      "name": "stringTooLong",
      "msg": "Market name or question exceeds max length"
    },
    {
      "code": 6030,
      "name": "invalidStartTime",
      "msg": "Trading has not started yet"
    },
    {
      "code": 6031,
      "name": "invalidEndTime",
      "msg": "Trading period has ended"
    },
    {
      "code": 6032,
      "name": "alreadyInitialized",
      "msg": "Global Already Initialized"
    },
    {
      "code": 6033,
      "name": "invalidAuthority",
      "msg": "Invalid Authority"
    },
    {
      "code": 6034,
      "name": "invalidArgument",
      "msg": "Invalid Argument"
    },
    {
      "code": 6035,
      "name": "marketNotCompleted",
      "msg": "The market has already ended."
    },
    {
      "code": 6036,
      "name": "marketIsCompleted",
      "msg": "The market already ended."
    },
    {
      "code": 6037,
      "name": "resolutiontokeytypeerror",
      "msg": "The winner token type error."
    },
    {
      "code": 6038,
      "name": "resolutionyesamounterror",
      "msg": "The winner yes token amount error."
    },
    {
      "code": 6039,
      "name": "resolutionnoamounterror",
      "msg": "The winner no token amount error."
    },
    {
      "code": 6040,
      "name": "withdrawliquiditysolamounterror",
      "msg": "The withdraw sol amount error."
    },
    {
      "code": 6041,
      "name": "withdrawnotlperror",
      "msg": "The withdraw: not lp error."
    },
    {
      "code": 6042,
      "name": "invalidCalculation",
      "msg": "Invalid calculation or arithmetic overflow"
    },
    {
      "code": 6043,
      "name": "slippageExceeded",
      "msg": "Slippage tolerance exceeded"
    },
    {
      "code": 6044,
      "name": "notALiquidityProvider",
      "msg": "Not a liquidity provider"
    },
    {
      "code": 6045,
      "name": "insufficientLpShares",
      "msg": "Insufficient LP shares"
    },
    {
      "code": 6046,
      "name": "insufficientLiquidity",
      "msg": "Insufficient liquidity in pool"
    },
    {
      "code": 6047,
      "name": "marketAlreadyCompleted",
      "msg": "Market already completed"
    },
    {
      "code": 6048,
      "name": "invalidTokenType",
      "msg": "Invalid token type"
    },
    {
      "code": 6049,
      "name": "noWinningTokens",
      "msg": "No winning tokens to claim"
    },
    {
      "code": 6050,
      "name": "alreadyClaimed",
      "msg": "Already claimed winnings"
    },
    {
      "code": 6051,
      "name": "featureDisabled",
      "msg": "Feature disabled - would break bonding curve"
    },
    {
      "code": 6052,
      "name": "marketClosed",
      "msg": "Market is closed"
    },
    {
      "code": 6053,
      "name": "invalidDateRange",
      "msg": "start_date must be before end_date"
    },
    {
      "code": 6054,
      "name": "endDateInPast",
      "msg": "end_date must be in the future"
    },
    {
      "code": 6055,
      "name": "oracleOwnerMismatch",
      "msg": "Oracle feed not owned by Switchboard program"
    },
    {
      "code": 6056,
      "name": "invalidOracleData",
      "msg": "Oracle data has no valid samples"
    },
    {
      "code": 6057,
      "name": "staleOracleData",
      "msg": "Oracle data is stale"
    },
    {
      "code": 6058,
      "name": "oracleNotConfigured",
      "msg": "Oracle feed not configured for this market"
    },
    {
      "code": 6059,
      "name": "marketNotExpired",
      "msg": "Market has not reached ending slot"
    },
    {
      "code": 6060,
      "name": "invalidOracleFeedLength",
      "msg": "Oracle feed data too short"
    },
    {
      "code": 6061,
      "name": "oracleResolutionAlreadyFinished",
      "msg": "Oracle resolution already completed"
    },
    {
      "code": 6062,
      "name": "invalidDirection",
      "msg": "Invalid swap direction (must be 0=Buy or 1=Sell)"
    },
    {
      "code": 6063,
      "name": "feeTooHigh",
      "msg": "Fee exceeds maximum allowed (500 bps = 5%)"
    },
    {
      "code": 6064,
      "name": "incompleteOracleConfig",
      "msg": "Oracle config incomplete: oracle_feed, price_target, and comparison_type must all be set together"
    },
    {
      "code": 6065,
      "name": "insufficientVaultBalance",
      "msg": "Insufficient SOL in vault for this operation"
    },
    {
      "code": 6066,
      "name": "manualResolutionNotAllowed",
      "msg": "Cannot manually resolve a market configured with oracle feed"
    },
    {
      "code": 6067,
      "name": "noTimeConstraint",
      "msg": "Market must have at least one time constraint (end_date or ending_slot)"
    },
    {
      "code": 6068,
      "name": "combinedFeeTooHigh",
      "msg": "Combined fees (platform + LP) exceed maximum allowed per side"
    },
    {
      "code": 6069,
      "name": "invalidRewardPoolVault",
      "msg": "Invalid reward pool vault address"
    },
    {
      "code": 6070,
      "name": "feeInvariantViolation",
      "msg": "Fee invariant violated: platform_fee + lp_fee + net_amount != gross amount"
    },
    {
      "code": 6071,
      "name": "marketV1NotFound",
      "msg": "MarketV1Config not found — this is a v0 market"
    },
    {
      "code": 6072,
      "name": "useV2Instructions",
      "msg": "Market is v1 — use v2 instructions"
    },
    {
      "code": 6073,
      "name": "insufficientPairs",
      "msg": "Insufficient collateral pairs"
    },
    {
      "code": 6074,
      "name": "invalidSp1Proof",
      "msg": "Invalid SP1 proof"
    },
    {
      "code": 6075,
      "name": "sp1VkeyMismatch",
      "msg": "SP1 VKey hash mismatch"
    },
    {
      "code": 6076,
      "name": "staleMerkleRoot",
      "msg": "Stale Merkle root in SP1 proof"
    }
  ],
  "types": [
    {
      "name": "bitShard",
      "docs": [
        "BitShard account for storing nullifiers",
        "Uses prefix-based routing for efficient lookups"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "prefixLen",
            "docs": [
              "How many bits of the nullifier we've consumed for routing"
            ],
            "type": "u8"
          },
          {
            "name": "prefix",
            "docs": [
              "The prefix bits (left-aligned in this array)"
            ],
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          },
          {
            "name": "count",
            "docs": [
              "Count of nullifiers in this shard"
            ],
            "type": "u32"
          },
          {
            "name": "nullifiers",
            "docs": [
              "Sorted list of nullifier hashes (for binary search)"
            ],
            "type": {
              "vec": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          }
        ]
      }
    },
    {
      "name": "completeEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "virtualSolReserves",
            "type": "u64"
          },
          {
            "name": "virtualTokenReserves",
            "type": "u64"
          },
          {
            "name": "realSolReserves",
            "type": "u64"
          },
          {
            "name": "realTokenReserves",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "pendingAuthority",
            "type": "pubkey"
          },
          {
            "name": "teamWallet",
            "type": "pubkey"
          },
          {
            "name": "platformBuyFee",
            "type": "u64"
          },
          {
            "name": "platformSellFee",
            "type": "u64"
          },
          {
            "name": "lpBuyFee",
            "type": "u64"
          },
          {
            "name": "lpSellFee",
            "type": "u64"
          },
          {
            "name": "tokenSupplyConfig",
            "type": "u64"
          },
          {
            "name": "tokenDecimalsConfig",
            "type": "u8"
          },
          {
            "name": "initialRealTokenReservesConfig",
            "type": "u64"
          },
          {
            "name": "minSolLiquidity",
            "type": "u64"
          },
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "rewardPoolVault",
            "docs": [
              "The reward pool vault PDA address (receives share of platform fees)",
              "When Pubkey::default(), fee splitting is disabled (all goes to team_wallet)"
            ],
            "type": "pubkey"
          },
          {
            "name": "oyradeMint",
            "docs": [
              "The OYRADE SPL token mint address (for holder discount verification)",
              "When Pubkey::default(), holder discount is disabled"
            ],
            "type": "pubkey"
          },
          {
            "name": "stakingFeeShareBps",
            "docs": [
              "Share of platform_fee sent to reward pool, in BPS (e.g., 3000 = 30%)"
            ],
            "type": "u64"
          },
          {
            "name": "tierBronzeMin",
            "docs": [
              "Bronze tier: minimum staked OYRADE (e.g., 1_000 * 10^6)"
            ],
            "type": "u64"
          },
          {
            "name": "tierBronzeDiscountBps",
            "docs": [
              "Bronze tier: discount in BPS (e.g., 1000 = 10%)"
            ],
            "type": "u64"
          },
          {
            "name": "tierSilverMin",
            "docs": [
              "Silver tier: minimum staked OYRADE (e.g., 10_000 * 10^6)"
            ],
            "type": "u64"
          },
          {
            "name": "tierSilverDiscountBps",
            "docs": [
              "Silver tier: discount in BPS (e.g., 2000 = 20%)"
            ],
            "type": "u64"
          },
          {
            "name": "tierGoldMin",
            "docs": [
              "Gold tier: minimum staked OYRADE (e.g., 50_000 * 10^6)"
            ],
            "type": "u64"
          },
          {
            "name": "tierGoldDiscountBps",
            "docs": [
              "Gold tier: discount in BPS (e.g., 3000 = 30%)"
            ],
            "type": "u64"
          },
          {
            "name": "tierDiamondMin",
            "docs": [
              "Diamond tier: minimum staked OYRADE (e.g., 100_000 * 10^6)"
            ],
            "type": "u64"
          },
          {
            "name": "tierDiamondDiscountBps",
            "docs": [
              "Diamond tier: discount in BPS (e.g., 4000 = 40%)"
            ],
            "type": "u64"
          },
          {
            "name": "rewardPoolProgram",
            "docs": [
              "The reward pool program ID (for StakeUser PDA verification)"
            ],
            "type": "pubkey"
          },
          {
            "name": "sp1VkeyHash",
            "docs": [
              "SP1 verification key hash. When [0u8; 32], SP1 verification is skipped (dev mode)."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "createEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "market",
            "type": "pubkey"
          },
          {
            "name": "tokenYes",
            "type": "pubkey"
          },
          {
            "name": "metadataYes",
            "type": "pubkey"
          },
          {
            "name": "tokenYesTotalSupply",
            "type": "u64"
          },
          {
            "name": "realYesSolReserves",
            "type": "u64"
          },
          {
            "name": "tokenNo",
            "type": "pubkey"
          },
          {
            "name": "metadataNo",
            "type": "pubkey"
          },
          {
            "name": "tokenNoTotalSupply",
            "type": "u64"
          },
          {
            "name": "realNoSolReserves",
            "type": "u64"
          },
          {
            "name": "startSlot",
            "type": "u64"
          },
          {
            "name": "endingSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "createMarketParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "yesSymbol",
            "type": "string"
          },
          {
            "name": "yesUri",
            "type": "string"
          },
          {
            "name": "marketName",
            "docs": [
              "Market name / ticker stored on-chain (max 32 chars)"
            ],
            "type": "string"
          },
          {
            "name": "question",
            "docs": [
              "Market question stored on-chain (max 100 chars)"
            ],
            "type": "string"
          },
          {
            "name": "slug",
            "docs": [
              "URL-friendly slug (max 128 chars)"
            ],
            "type": "string"
          },
          {
            "name": "imageUrl",
            "docs": [
              "Market image URL (max 256 chars)"
            ],
            "type": "string"
          },
          {
            "name": "source",
            "docs": [
              "Source (e.g. Pumpfun) (max 32 chars)"
            ],
            "type": "string"
          },
          {
            "name": "category",
            "docs": [
              "Category (e.g. Crypto, Politics) (max 32 chars)"
            ],
            "type": "string"
          },
          {
            "name": "startSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "endingSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "startDate",
            "docs": [
              "Unix timestamp (seconds) when the market opens for trading"
            ],
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "endDate",
            "docs": [
              "Unix timestamp (seconds) when the market closes"
            ],
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "oracleFeed",
            "docs": [
              "Switchboard feed pubkey for automated resolution"
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "priceTarget",
            "docs": [
              "Target value for comparison (scaled integer matching oracle precision)"
            ],
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "comparisonType",
            "docs": [
              "Comparison type: 0=GT, 1=LT, 2=EQ"
            ],
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "metricType",
            "docs": [
              "Metric type for UI: 0=price, 1=mcap, 2=curve_pct"
            ],
            "type": {
              "option": "u8"
            }
          }
        ]
      }
    },
    {
      "name": "createMarketV2Params",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "yesSymbol",
            "type": "string"
          },
          {
            "name": "yesUri",
            "type": "string"
          },
          {
            "name": "marketName",
            "type": "string"
          },
          {
            "name": "question",
            "type": "string"
          },
          {
            "name": "slug",
            "type": "string"
          },
          {
            "name": "imageUrl",
            "type": "string"
          },
          {
            "name": "source",
            "type": "string"
          },
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "startSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "endingSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "startDate",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "endDate",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "oracleFeed",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "priceTarget",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "comparisonType",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "metricType",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "collateralPerPair",
            "docs": [
              "Face value of collateral per YES+NO pair (lamports).",
              "E.g., 1_000_000_000 = 1 SOL per pair."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "globalUpdateEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "globalAuthority",
            "type": "pubkey"
          },
          {
            "name": "initialRealTokenReserves",
            "type": "u64"
          },
          {
            "name": "tokenTotalSupply",
            "type": "u64"
          },
          {
            "name": "mintDecimals",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "lp",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lpAddress",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "market",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "yesTokenMint",
            "type": "pubkey"
          },
          {
            "name": "noTokenMint",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "marketName",
            "docs": [
              "Human-readable market name / ticker (e.g. \"TRUMP2024\")"
            ],
            "type": "string"
          },
          {
            "name": "question",
            "docs": [
              "Market question (e.g. \"Will X happen?\")"
            ],
            "type": "string"
          },
          {
            "name": "slug",
            "docs": [
              "URL-friendly identifier (e.g. \"whitewhale-price-tomorrow-at-12am-est-above-090\")"
            ],
            "type": "string"
          },
          {
            "name": "imageUrl",
            "docs": [
              "Market image URL"
            ],
            "type": "string"
          },
          {
            "name": "source",
            "docs": [
              "Source of the market (e.g. \"Pumpfun\", \"Syzy\")"
            ],
            "type": "string"
          },
          {
            "name": "category",
            "docs": [
              "Category (e.g. \"Crypto\", \"Politics\")"
            ],
            "type": "string"
          },
          {
            "name": "createdAt",
            "docs": [
              "Unix timestamp when the market was created"
            ],
            "type": "i64"
          },
          {
            "name": "initialYesTokenReserves",
            "type": "u64"
          },
          {
            "name": "realYesTokenReserves",
            "type": "u64"
          },
          {
            "name": "realYesSolReserves",
            "type": "u64"
          },
          {
            "name": "tokenYesTotalSupply",
            "type": "u64"
          },
          {
            "name": "initialNoTokenReserves",
            "type": "u64"
          },
          {
            "name": "realNoTokenReserves",
            "type": "u64"
          },
          {
            "name": "realNoSolReserves",
            "type": "u64"
          },
          {
            "name": "tokenNoTotalSupply",
            "type": "u64"
          },
          {
            "name": "isCompleted",
            "type": "bool"
          },
          {
            "name": "winningOutcome",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "startSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "endingSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "startDate",
            "docs": [
              "Unix timestamp (seconds) when the market opens for trading"
            ],
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "endDate",
            "docs": [
              "Unix timestamp (seconds) when the market closes"
            ],
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "lps",
            "type": {
              "vec": {
                "defined": {
                  "name": "lp"
                }
              }
            }
          },
          {
            "name": "totalLpAmount",
            "type": "u64"
          },
          {
            "name": "oracleFeed",
            "docs": [
              "Switchboard feed address for automated resolution"
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "priceTarget",
            "docs": [
              "Target value for comparison (scaled integer, e.g. lamports or 18-decimal)"
            ],
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "comparisonType",
            "docs": [
              "Comparison type: 0=GT (greater than), 1=LT (less than), 2=EQ (equal within 0.1%)"
            ],
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "metricType",
            "docs": [
              "Metric type for UI display: 0=price, 1=mcap, 2=curve_pct (informational only)"
            ],
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "oracleResolutionFinished",
            "docs": [
              "Whether oracle resolution has been finalized (prevents double-resolution)"
            ],
            "type": "bool"
          },
          {
            "name": "resolvedAt",
            "docs": [
              "Unix timestamp when resolution occurred"
            ],
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "resolvedBy",
            "docs": [
              "Resolution source: 0=admin, 1=oracle"
            ],
            "type": {
              "option": "u8"
            }
          }
        ]
      }
    },
    {
      "name": "marketV1Config",
      "docs": [
        "Configuration for v1 Conditional Token markets.",
        "",
        "In v1 markets, each YES+NO pair is backed by exactly `collateral_per_pair` lamports.",
        "The AMM is a single YES/NO constant-product pool (no SOL moves during swaps).",
        "Winning tokens redeem at fixed face value: tokens * collateral_per_pair / TOKEN_MULTIPLIER.",
        "",
        "PDA seeds: [\"market_v1_config\", market.key()]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "market",
            "docs": [
              "The market this config belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "collateralPerPair",
            "docs": [
              "Face value of collateral per YES+NO pair (lamports)"
            ],
            "type": "u64"
          },
          {
            "name": "totalCollateralDeposited",
            "docs": [
              "Total SOL collateral deposited into this market"
            ],
            "type": "u64"
          },
          {
            "name": "totalPairsMinted",
            "docs": [
              "Total token pairs minted (each pair = TOKEN_MULTIPLIER YES + TOKEN_MULTIPLIER NO)"
            ],
            "type": "u64"
          },
          {
            "name": "ammYesReserves",
            "docs": [
              "YES token reserves in the AMM pool"
            ],
            "type": "u64"
          },
          {
            "name": "ammNoReserves",
            "docs": [
              "NO token reserves in the AMM pool"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "merkleMountainRange",
      "docs": [
        "Merkle Mountain Range state for storing commitments",
        "This structure efficiently stores commitments without requiring the full tree"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "merkleRootBatch",
            "docs": [
              "Current merkle root of the batch (16 leaves)"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "batchLeaves",
            "docs": [
              "Leaves array of size 16 (current batch buffer)"
            ],
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    32
                  ]
                },
                16
              ]
            }
          },
          {
            "name": "identifier",
            "docs": [
              "Unique identifier for this pool"
            ],
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "minDepositAmount",
            "docs": [
              "Minimum deposit amount (in lamports)"
            ],
            "type": "u64"
          },
          {
            "name": "wholeTreeRoot",
            "docs": [
              "Root of the entire tree (computed from peaks)"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "lastSmallTreeRoot",
            "docs": [
              "Root of the last completed small tree (for indexing)"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "batchNumber",
            "docs": [
              "Current batch number (increments every 16 leaves)"
            ],
            "type": "u64"
          },
          {
            "name": "peaks",
            "docs": [
              "Peaks array for MMR structure"
            ],
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    32
                  ]
                },
                26
              ]
            }
          },
          {
            "name": "depth",
            "docs": [
              "Depth of each peak"
            ],
            "type": {
              "array": [
                "u8",
                26
              ]
            }
          },
          {
            "name": "numberOfPeaks",
            "docs": [
              "Number of active peaks"
            ],
            "type": "u8"
          },
          {
            "name": "maxLeaves",
            "docs": [
              "Maximum leaves this pool can hold"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "oracleResolutionEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "market",
            "type": "pubkey"
          },
          {
            "name": "oracleFeed",
            "type": "pubkey"
          },
          {
            "name": "oracleValue",
            "type": "i128"
          },
          {
            "name": "priceTarget",
            "type": "u64"
          },
          {
            "name": "comparisonType",
            "type": "u8"
          },
          {
            "name": "winningOutcome",
            "type": "u8"
          },
          {
            "name": "resolvedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "shieldedMarketPool",
      "docs": [
        "Shielded Market Pool - Links MMR to a prediction market",
        "This enables privacy-preserving betting for VIP users"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mmr",
            "docs": [
              "The Merkle Mountain Range for storing commitments"
            ],
            "type": {
              "defined": {
                "name": "merkleMountainRange"
              }
            }
          },
          {
            "name": "market",
            "docs": [
              "The prediction market this pool is linked to"
            ],
            "type": "pubkey"
          },
          {
            "name": "shieldedSolBalance",
            "docs": [
              "Total shielded SOL balance in the pool"
            ],
            "type": "u64"
          },
          {
            "name": "shieldedYesCount",
            "docs": [
              "Count of shielded YES position commitments"
            ],
            "type": "u64"
          },
          {
            "name": "shieldedNoCount",
            "docs": [
              "Count of shielded NO position commitments"
            ],
            "type": "u64"
          },
          {
            "name": "authority",
            "docs": [
              "Pool authority (usually the market creator or admin)"
            ],
            "type": "pubkey"
          },
          {
            "name": "isActive",
            "docs": [
              "Whether the pool is active"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA derivation"
            ],
            "type": "u8"
          },
          {
            "name": "poolFeesCollected",
            "docs": [
              "Accumulated pool fees (POOL_FEE from shielded operations) not tracked in shielded_sol_balance"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "swapFeeEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "market",
            "type": "pubkey"
          },
          {
            "name": "direction",
            "type": "u8"
          },
          {
            "name": "tokenType",
            "type": "u8"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "platformFee",
            "type": "u64"
          },
          {
            "name": "lpFee",
            "type": "u64"
          },
          {
            "name": "discountBps",
            "type": "u64"
          },
          {
            "name": "rewardShare",
            "type": "u64"
          },
          {
            "name": "teamShare",
            "type": "u64"
          },
          {
            "name": "netAmount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "teeRegistry",
      "docs": [
        "Global registry of authorized TEE operator pubkeys.",
        "Only operators listed here can call `tee_batch_sell` / `tee_batch_claim`.",
        "",
        "PDA: seeds = [b\"tee_registry\"], bump",
        "Space: 8 (discriminator) + 32 (authority) + (4 + 32*10) (operators vec) + 1 (bump) = 365"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The admin authority (copied from Config.authority at init time)"
            ],
            "type": "pubkey"
          },
          {
            "name": "operators",
            "docs": [
              "Registered TEE operator pubkeys (max 10)"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "tradeEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "tokenYes",
            "type": "pubkey"
          },
          {
            "name": "tokenNo",
            "type": "pubkey"
          },
          {
            "name": "marketInfo",
            "type": "pubkey"
          },
          {
            "name": "solAmount",
            "type": "u64"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          },
          {
            "name": "feeLamports",
            "type": "u64"
          },
          {
            "name": "isBuy",
            "type": "bool"
          },
          {
            "name": "isYesNo",
            "type": "bool"
          },
          {
            "name": "realSolReserves",
            "type": "u64"
          },
          {
            "name": "realTokenYesReserves",
            "type": "u64"
          },
          {
            "name": "realTokenNoReserves",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "updateMarketParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketName",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "question",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "slug",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "imageUrl",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "source",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "category",
            "type": {
              "option": "string"
            }
          }
        ]
      }
    },
    {
      "name": "userInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "yesTokenAmount",
            "type": "u64"
          },
          {
            "name": "noTokenAmount",
            "type": "u64"
          },
          {
            "name": "lpAmount",
            "type": "u64"
          },
          {
            "name": "isLp",
            "type": "bool"
          },
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "hasClaimedYes",
            "type": "bool"
          },
          {
            "name": "hasClaimedNo",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "withdrawEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "withdrawAuthority",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "feeVault",
            "type": "pubkey"
          },
          {
            "name": "withdrawn",
            "type": "u64"
          },
          {
            "name": "totalWithdrawn",
            "type": "u64"
          },
          {
            "name": "withdrawTime",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
