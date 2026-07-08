// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 2277056244544614985611181937221034824928324343204986994153165552446428736413;
    uint256 constant alphay  = 10482603869144384355337328880945802794440365299701949536387207631398559087265;
    uint256 constant betax1  = 9142464342140614372810981093356599565655913453383512017189749574340101634415;
    uint256 constant betax2  = 267504663052083300348323367953467850071668987687493982283759638736295668189;
    uint256 constant betay1  = 342961507778170742483589747415688658874941560943313210778490457417310308282;
    uint256 constant betay2  = 2308906282177584450333458157603579582887664898173399278194134407798668628788;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 13119133242507307626711130784888837557745487283737208397708787350307661705042;
    uint256 constant deltax2 = 7758742855020809661104359571781145871503564357762940835047598830522269620238;
    uint256 constant deltay1 = 143043965312113956769329700559668357168294726270476716806605973546541154516;
    uint256 constant deltay2 = 12719026389783485896890476792893770851262823179633283560774455574903857885356;

    
    uint256 constant IC0x = 16962861064942862078106855868778635977968362973546695955603040574763523162701;
    uint256 constant IC0y = 19295321502844512752845928805471814620937292987330020285521373039908143074465;
    
    uint256 constant IC1x = 13337056621802910693768141238835942724741095816466837209787307562661316165556;
    uint256 constant IC1y = 5996262528393691480466376634400324998315742880880555384934382124405744930177;
    
    uint256 constant IC2x = 8477089475488263335665725390359086429048183814957627066167327939000539154505;
    uint256 constant IC2y = 17702307697262504677945212883006107026533447264798387451123123895243074581555;
    
    uint256 constant IC3x = 10485157513819733513284789770406593676959196658296763097817012686919469341456;
    uint256 constant IC3y = 14261324159099511618293423109575213941046306191762459190521144366695545028237;
    
    uint256 constant IC4x = 16696305289037260803416893441782918720052853645420586097448171569347399004930;
    uint256 constant IC4y = 11765792799425913821085424277899711653104287058969047036445191147846726024237;
    
    uint256 constant IC5x = 15023521519424030223939418479925573097487103777003144923742834128748877794496;
    uint256 constant IC5y = 2860873011720943042773322127978784160498949031342150850777678273034308209211;
    
    uint256 constant IC6x = 1550647477304583838006205885576499537529370088101690993568617796039464623115;
    uint256 constant IC6y = 18489985774874496146303302543081240830700190018245761438901899734020485141608;
    
    uint256 constant IC7x = 4864466589697373370978772876754994522626012099471349355930193579609730678458;
    uint256 constant IC7y = 7046242441334242277145998383235114834496702718375273892464287082091638156661;
    
    uint256 constant IC8x = 17900473733738018795725981474038523213729497468394543676280617302121942054294;
    uint256 constant IC8y = 21450444144750589804102064123205480917238246221272723099454844752237467135170;
    
    uint256 constant IC9x = 2319467008055046234533961837315707414755587598220164370730261452229667822891;
    uint256 constant IC9y = 20333460681746234917307929933388300303341216228932501291934318912635550875833;
    
    uint256 constant IC10x = 2724622539735732087629142240774642760733123984386833387813481585209957756631;
    uint256 constant IC10y = 9753012050883512346843453797679565117031764504492183452186830810932607759975;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[10] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
