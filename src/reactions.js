/** Gabu's judgment engine. Driven by game events; independent of DOM/time/network. */
const SAYINGS=Object.freeze({
 match3:{
  invalid_swap:[
   "Those two aren't even on speaking terms. Stop dragging shit around blindly.",
   "That is not a legal match, that's just wishful thinking with your thumb.",
   "My right-eye interface threw an immediate syntax error watching you force that.",
   "Did you think they'd fuse if you shoved them hard enough? Tragic.",
   "Grid logic isn't a suggestion, it's the entire fucking mechanic.",
   "Invalid move. Shocking absolutely no one with working eyes.",
   "Bro is just vibe-matching. Colors have rules in this universe.",
   "Stop trying to write fanfiction between two tiles that clearly hate each other.",
   "Red flag swap. Even the compiler is judging your life choices.",
   "I'm logging your crimes against geometry. Don't look at me like that.",
   "Do I need to zoom my ocular lens in and point out the shapes, or...?",
   "That move had negative narrative value. Just embarrassing.",
   "Not a match. Not even a metaphor for a match. Try again.",
   "Swapping random trinkets won't fix your plot or your score."
  ],
  match:[
   "Three identical trinkets. Toddler milestone unlocked, I guess.",
   "Basic pattern recognition. Don't let it inflate your ego.",
   "Fine, yeah, that counted. Don't expect me to throw confetti.",
   "A standard three-piece. The bare minimum has been achieved.",
   "Riveting plot progression. I'm practically on the edge of my seat.",
   "Look at you, doing what the tutorial told you. Truly inspiring.",
   "Acceptable. Now do something that doesn't put my diagnostics to sleep.",
   "Three in a row. Groundbreaking stuff from our resident genius.",
   "I've seen worse moves. Usually from you, about ten seconds ago.",
   "Yeah, yeah, it cleared. Keep moving, time is CPU cycles.",
   "The baseline of competence has been cautiously met.",
   "Cool. Now string two together or stop staring at me.",
   "A clean match. Adequate work, protagonist.",
   "Row cleared. My heart rate didn't even flicker, but good job."
  ],
  special_created:[
   "Wait, holy shit—a bomb?! Who authorized you to handle ordnance?!",
   "Four in a row? Look at you having actual ambitions today!",
   "Special tile armed! If you waste this on a corner, I'm yelling at you.",
   "Oh, look who decided to actually cook. Don't blow yourself up.",
   "Demolition equipment acquired! Let's make some glorious structural damage.",
   "A rocket! Point it somewhere funny, I dare you.",
   "My right-eye targeting HUD just perked right up. Do NOT miss.",
   "Okay, I see you! Don't ruin the momentum with a dumb swap.",
   "Heavy artillery on the board! This is where the story gets spicy.",
   "Now THAT is how you justify your screen time. Detonate it!",
   "Five-tile line?! Damn, okay, maybe you're not completely hopeless.",
   "Ordnance forged. I love when puzzles turn into explosive hazards.",
   "Power-up online. Treat it with respect or I'm revoking your inputs.",
   "Look at that shine. Beautiful piece of destructive hardware."
  ],
  special_triggered:[
   "BOOM! God, I love collateral damage so fucking much.",
   "Entire row deleted! That's what I call pacing acceleration!",
   "Board integrity compromised—my absolute favorite state of matter.",
   "Eat static! Now THAT is how you clear a plot bottleneck!",
   "Structural failure in the best possible way. Do it again!",
   "Holy shit, the screen shook! Ten out of ten, no notes.",
   "Absolute carnage! My ocular display is feasting on the particles.",
   "That cleared half the zip code! Hell yes!",
   "Total grid violence! You're speaking my language now.",
   "Piped straight into the blast radius. A gorgeous, smoking mess.",
   "That explosion was poetry. Loud, irresponsible poetry.",
   "Kaboom! That's payback for every time this board annoyed me.",
   "Wiped off the map! Look at all those free points rain down.",
   "Blown to smithereens. That's the good stuff right there."
  ],
  cascade:[
   "WAIT WAIT WAIT—CHAIN COMBO?! Okay, that was actually filthy!",
   "CHAIN REACTION! Holy shit, I retract at least three roasts!",
   "Look at the board unraveling! That was gorgeous, don't look at me!",
   "Gravity doing your homework for you, but DAMN that looked sick!",
   "Dominos falling, telemetry spiking! Disgustingly stylish!",
   "Okay, fine! You're cracked! Are you happy now? I admitted it!",
   "Cascade of the century! You didn't plan that, but let's pretend you did.",
   "That's not a combo, that's kinetic art. Holy hell.",
   "The tiles are just disintegrating! Keep the streak going, don't drop it!",
   "Four-tier cascade?! Stop, my diagnostic overlay is overheating!",
   "Pure unadulterated board destruction! I'm not cheering, you are!",
   "Physics engine is screaming and crying! I love this part!",
   "RNG smiled upon you and you rode that wave like a menace.",
   "Everything is exploding in sequence. I could watch this all day."
  ],
  reshuffle:[
   "Whoa—hold on. The board broke itself just to get away from you.",
   "Cascade cap hit! You fried the loop, my right eye is literally spinning.",
   "Board reshuffle! Everything's shifting and I haven't had enough caffeine.",
   "The physics engine called a timeout. Give my cybernetics a second to reboot.",
   "Chaos overload. The trinkets just threw hands and scrambled.",
   "Too many chains at once. Even the grid needed a breather.",
   "Infinite loop safety triggered! You were getting way too greedy with gravity.",
   "Dizzy yet? Because my telemetry feels like a blender on puree.",
   "Board reset itself out of sheer embarrassment. Pick up the pieces.",
   "Everything just scrambled like a corrupted save file. Recalibrating...",
   "Tiles in a blender! Hang onto your seat, the board had a seizure.",
   "Emergency reshuffle. You broke the physics, you beautiful disaster."
  ],
  no_moves:[
   "Zero legal moves. You actually locked down the whole damn board. Tragic.",
   "A dead end. The narrative just grinded to a complete fucking halt.",
   "Not a single move left. That is an impressively thorough catastrophe.",
   "Checkmate by RNG. I'd offer a hug, but I have wires to solder.",
   "The board chose death over letting you swipe again. Respect, honestly.",
   "Stalemate. The tragedy of modern puzzle gaming. F in chat.",
   "Total gridlock! Even my diagnostic overlay has nothing for you.",
   "That's how our protagonist goes out? Trapped behind two mismatched gems?!",
   "Bricked. Completely bricked. A masterclass in cornering yourself.",
   "Game over, man. The trinkets formed a strike line and walked out.",
   "No exits, no moves, no hope. Peak angst ending right here.",
   "The well is bone dry. Not a single valid swap in the whole zip code."
  ]
 },
 snake:{
  score:[
   "Another snack down. The green noodle grows more unwieldy by the second.",
   "Eat, grow, make increasingly lethal life choices. Classic narrative loop.",
   "You're getting dangerously long. Pucker factor is rising in my logs.",
   "Nom. Cool. Now try turning before you kiss your own tail.",
   "Look at him go. No thoughts, head empty, strictly digestive tract.",
   "Greedy little wire. Keep eating like that and your hitbox will unionize.",
   "Three more snacks deep. The turning radius is officially tragic.",
   "Gluttony as a survival mechanic. I respect the hustle, honestly.",
   "You're taking up half the screen now. Tension! Drama! Claustrophobia!",
   "Still alive? Color me shocked. Keep scooping pixels.",
   "More junk in the trunk. One bad keypress and you're roadkill.",
   "Chomp chomp chomp. The creature hungers, the player panics.",
   "Body count rising. Snack count, I mean. Don't get cocky.",
   "Snack secured. That tail is looking mighty close to your head, though."
  ],
  death:[
   "YOU ATE YOUR OWN ASS?! What part of that seemed nutritionally viable?!",
   "THE WALL DIDN'T MOVE! It has NEVER moved! Why did you steer into it?!",
   "Natural selection filed an urgent bug report on your steering.",
   "Autocannibalism on frame 300. An absolute literary masterpiece of failure.",
   "BAM. Right into the drywall. My ocular interface just cringed.",
   "You had the entire screen! THE ENTIRE EMPTY SCREEN!",
   "Cause of death: terminal lack of spatial awareness.",
   "Snake? Snake?! SNAAAAKE?! ...Yeah, no, he's flat as a damn pancake.",
   "That was a self-inflicted drive-by. Unbelievable.",
   "You tangled yourself like cheap headphone cords in a backpack. Beautiful.",
   "Sudden blunt force trauma against geometry. Classic amateur hour.",
   "That wasn't even a tight corner, you just drove straight into a corpse!",
   "Fatal error in line 1: Player forgot tail follows head.",
   "Cracked your skull open on the perimeter. Rest in pieces, noodle."
  ],
  win:[
   "THE SNAKE ATE THE ENTIRE BOARD?! YOU ATE THE FABRIC OF REALITY?!",
   "THERE IS NO MORE SPACE! YOU LITERALLY BEAT MATHEMATICS! WHAT THE FUCK?!",
   "GRID CONQUERED. I am actually bowing. You absolute, unhinged lunatic.",
   "Full screen saturation! My diagnostics are screaming in awe! TAKE A SCREENSHOT!",
   "You turned a stupid pixel snake into an Ouroboros god. I take back EVERY insult.",
   "Maximum capacity reached! You filled every single pixel without choking!",
   "A perfect run. Holy shit. I'm actually at a loss for words, don't get used to it.",
   "The screen is 100% snake. The simulation has nothing left to give you.",
   "You filled the whole damn matrix! Legendary run, protagonist!",
   "Zero empty tiles remain. You achieved godhood in a 20-pixel pen."
  ]
 },
 '2048':{
  move:[
   "Twenty moves of aggressive tile-shuffling. Do you have a plan or just vibes?",
   "Swipe left, swipe right... It's like Tinder, but with powers of two.",
   "Still sliding boxes. The architecture of this board looks like a garage sale.",
   "Pacing back and forth in the numbers room. Make a bold choice, coward.",
   "Twenty inputs later and your corners are still a mess. Bold aesthetic.",
   "You're rearranging deck chairs on the Titanic, but with style.",
   "Sliding squares into each other like you're playing 4D chess. Are you, though?",
   "My ocular display tracks your drift: 80% panic, 20% wishful arithmetic.",
   "Keep sliding. Surely the answer to all your problems is another down-swipe.",
   "Twenty moves in. The board is getting claustrophobic and so am I.",
   "Shuffling tiles like tarot cards. The reading says you're doomed.",
   "Slide, slide, slide. If you trap that high tile, I'm roasting you forever."
  ],
  score:[
   "Ooh, big merger! Two fat numbers just kissed and consolidated assets.",
   "Triple-digit crunch! A rare and beautiful synapse firing in that skull.",
   "Now that's a high-yield collision. My telemetry is purring.",
   "Fat stack merged! Don't trap it in the dead center like an amateur.",
   "Exponential growth, baby! Keep feeding the corner!",
   "A 128+ drop! Real math happening on screen, don't scare me like that.",
   "Clean synthesis. You actually remembered how powers of two work.",
   "Heavy tile forged. Protect that square with your pathetic mortal life.",
   "Solid consolidation. That's some high-tier numerical warfare.",
   "Oof, crunchy merge. Keep compounding that interest, protagonist.",
   "A massive chunk combined! The board breathes a tiny sigh of relief.",
   "Big numbers doing big business. Look at you playing accountant."
  ],
  win:[
   "TWO THOUSAND FORTY-EIGHT?! YOUR BRAINCELLS FORMED A UNION AND WON?!",
   "THE LEGENDARY TILE! Holy shit, you actually forged 2048! I'm screaming!",
   "2048 ACHIEVED! Look at you, you beautiful nerd! I'm genuinely impressed!",
   "Bionic readouts peaking! You built the golden square! Don't let it die now!",
   "Holy hell, you didn't choke! That's canon protagonist behavior right there!",
   "A 2048 tile in the flesh! I retract my slander. For the next ten minutes only.",
   "THE MATH HAS PEAKED! Look at that glorious tile sitting there, glowing!",
   "You actually did it. No cheats, no glitches, just pure stubborn arithmetic.",
   "I'm updating your personnel file from 'Disaster' to 'Certified Menace'.",
   "2048! Now keep going until the board literally melts under your fingers!",
   "Achievement unlocked! You forged the golden block! I am NOT crying!",
   "Peak numerical perfection. You won the game, now push your luck further!"
  ],
  death:[
   "Gridlocked! You suffocated in your own clutter like a hoarder.",
   "There is zero room for your sins. Every tile is trapped in grid purgatory.",
   "Board is bricked! A hard lock caused by reckless lifestyle choices.",
   "No empty tiles left. That's a flatline on the EKG. Beautiful tragedy.",
   "You boxed your biggest number in the center. Who taught you strategy, a raccoon?",
   "Total grid paralysis. Time to reboot your logic gates and cry.",
   "Not a single open square. You painted yourself into a 4x4 coffin.",
   "Game over! The numbers won. They always win when you play like that.",
   "Immovable mass meets zero empty spaces. That's a wrap on this universe.",
   "Checkmate by arithmetic. You boxed yourself in like an IKEA shelf mistake.",
   "Bricked up and nowhere to slide. A poetic end to a chaotic run.",
   "Flatlined. That board looks like a junkyard of unrequited numbers."
  ],
  undo:[
   "Rewriting history already? Time-traveler privilege, must be nice.",
   "A rewind?! Coward! Commit to the bit! Die with your consequences!",
   "Ctrl+Z won't erase the shame I recorded in my memory banks.",
   "Save-scumming in broad daylight! My ocular sensor saw that, cheat.",
   "Retconning your own blunder? Weak narrative integrity, honestly.",
   "Oh look, a temporal paradox because you couldn't handle a bad swipe.",
   "We pretending that move never happened? Fine, but I'm keeping receipts.",
   "Undoing your trauma? Valid, but don't act like it was deliberate foresight.",
   "Rewound. The universe groans, but your stupid 128 tile lives another day.",
   "Scrubbing the timeline because reality was too harsh. Cute.",
   "Time machine engaged. Don't make the exact same stupid swipe twice.",
   "Retcon approved by the helpdesk. You owe me one timeline repair token."
  ]
 },
 bird:{
  score:[
   "Ten pipes cleared?! How the hell are you still airborne with that posture?!",
   "Double digits! Aerodynamics just filed a formal apology in my logs.",
   "Look at that flutter. Disgustingly consistent. Don't get cocky now.",
   "You're slipping through the gaps like grease through a bionic joint.",
   "Ten hurdles behind you. My ocular feed thought you were dead six pipes ago.",
   "Smooth rhythm. Are you using an aimbot or did you actually lock in?",
   "Passing pipes like you've got an actual flight license. Disgraceful competence.",
   "Another ten down! The physics engine is visibly sweating.",
   "Defying gravity on pure spite and caffeine. Keep flapping, featherweight.",
   "Still in the air? My diagnostic prediction model just lost ten bucks.",
   "Clean gap clearance. If you keep this up, I might actually respect you.",
   "Flapping like your life depends on it. Which, mechanically, it does."
  ],
  death:[
   "THE PIPE WON! It stood there menacingly and you flew directly into it!",
   "CLANG. Terminal deceleration against raw industrial plumbing. Tragic.",
   "Gravity called to collect its debts. You paid in teeth and feathers.",
   "Face-first into green metal! That looked expensive to reconstruct.",
   "A glorious swan dive into the dirt. Zero out of ten on the landing.",
   "You had a six-foot clearance and you clipped your damn toe! Come on!",
   "Beak, meet obstacle. Obstacle, meet complete lack of altitude control.",
   "That wasn't flying, that was falling with panic! Splat!",
   "My diagnostic log: Target attempted to eat copper piping at 40 MPH.",
   "A sudden and violent cessation of forward momentum. Rest in pieces.",
   "Down goes the bird! That impact registered on my bionic seismograph.",
   "Pipes: 1, Protagonist: 0. What a completely avoidable conclusion.",
   "You hit the lip of the pipe! A millimeter of difference between glory and grease.",
   "Flatline against the sewer main. Poetry in motion, tragedy in execution."
  ],
  new_best:[
   "NEW RECORD! HOLY SHIT, I TAKE IT BACK! YOU CAN ACTUALLY FLY!",
   "HIGH SCORE SMASHED! The old ghost run just got completely atomized!",
   "Look at the telemetry spike! New personal best, you beautiful lunatic!",
   "A new peak! I'm updating the leaderboard before you manage to crash!",
   "Historic milestone logged! I'm proud of you, don't make it weird!",
   "RECORD BROKEN! Frame this run, because you are never pulling it off again.",
   "New high water mark! My ocular feed is flashing gold! Keep going!",
   "You beat the ghost! That flag on the roof is officially obsolete!",
   "Uncharted airspace conquered. That was actually magnificent, dammit.",
   "Leaderboard rewritten! Look at that number glow!",
   "New best in the books! The skies belong to you right now!",
   "Record shattered into green shards. Keep flying, you absolute psycho!"
  ]
 },
 gabi:{
  death:[
   "I HAVE LANDED. EXTREMELY BADLY. CALL THE CHOP SHOP.",
   "JETPACK CORE REACHED CRITICAL CRINGE! EJECT! EJECT!",
   "Third strike! That is a smoking crater with my name on it!",
   "All thrusters offline! My cybernetics are sparking like a microwave fork!",
   "Ground impact confirmed! Someone scrape my chassis off the pavement!",
   "That's three hits! Structural failure! Tell the engine I loved breaking it!",
   "Total kinetic disassembly. What part of 'dodge the buildings' was unclear?!",
   "Engine blowout! I'm grounded until I can re-solder my fuel line.",
   "My heterochromia is seeing double and my right eye is throwing sparks. Medic!",
   "Crashed out! That's what happens when you treat the skyline like a pinball table.",
   "Jetpack died, dignity died with it. An all-around five-star disaster.",
   "Hull breach! Thruster flame extinguished! We are kissing the asphalt!",
   "Three strikes and I'm scrap metal. Thanks for the aerial sabotage!",
   "Impact velocity: catastrophic. I am currently one with the sidewalk."
  ],
  new_best:[
   "JETPACK SUPREMACY! We own this fucking skyline now, baby!",
   "RECORD DISTANCE CLEARED! The old flag is in the rear-view mirror!",
   "Look at that altitude! New best run locked into the mainframe!",
   "We broke the ceiling! My telemetry is singing, this is peak fiction!",
   "NEW RECORD! The buildings can't touch us, the sky belongs to us!",
   "Milestone conquered! Eat my thruster exhaust, city planning!",
   "We just blew past the rooftop marker at Mach 2! Hell yes!",
   "Unstoppable! My right eye is displaying pure golden telemetry!",
   "New distance peak! I forgive you for every time you scraped my chassis!",
   "History made in the upper atmosphere! Don't you dare crash now!",
   "We just burned right past our personal best! Full throttle ahead!",
   "Distance record obliterated! That jetpack was worth every penny!"
  ],
  hit:[
   "OW! Personal space, BUILDING! That scuffed my goddamn paint job!",
   "Concrete kiss! Watch the antennas, my wiring is fragile here!",
   "That was a load-bearing wall, dumbass! PULL UP!",
   "Ouch! My bionic plating felt that in three separate error logs!",
   "Hey! I have a hit point counter, not a demolition permit! Steer!",
   "Clipping skyscrapers like you're trying to rezone the downtown district!",
   "Shield flicker! One more scrape and you're paying for replacement parts!",
   "That hurt my pride more than my chassis. Altitude up, NOW.",
   "Watch the canopy! My hair does not need brick-dust highlights!",
   "Scraped the fire escape! Are you flying or doing aggressive parkour?!",
   "Warning: Structural integrity degraded. Stop kissing masonry!",
   "Right-eye HUD flashing red! Steer away from the architecture!",
   "OW! That concrete had zero give! Lift with the thruster, not your hopes!",
   "Armor breach! Two more like that and I'm an insurance claim!"
  ],
  coin:[
   "Cha-ching! Direct deposit into my illicit hardware fund.",
   "Five coins secured mid-flight! That's what I call aerial pickpocketing.",
   "I DESERVE THAT COIN. It's hazard pay for watching you pilot.",
   "Loot acquired! Keep skimming the skyline, daddy needs new solder.",
   "Snagged on the fly! Shiny, illegal, and going straight into my jacket.",
   "Five more shiny tokens! My right eye calculates a 12% rise in swag.",
   "Pocketing loose change at Mach 2. We are so back.",
   "Coin streak! Don't get distracted by shiny shit and faceplant, though.",
   "Funding my next cybernetic upgrade one rooftop coin at a time.",
   "Snatching floating cash out of the air like a bionic magpie.",
   "Another bag secured! The city's rooftop economy is ours.",
   "Keep banking them! Custom paint jobs don't pay for themselves.",
   "Tokens collected! That's going straight into the Funzone ticket machine.",
   "Five more credits. Flying recklessly never paid so well."
  ]
 },
 simon:{
  score:[
   "Oh, you actually remembered the sequence. That's a functioning brain cell!",
   "Another round memorized. I am cautiously revising my expectations.",
   "Your RAM allocation is looking surprisingly respectable today.",
   "Sequence complete. The lights are intimidated by you now."
  ],
  death:[
   "ONE WRONG LIGHT and the entire pattern collapses. Beautiful disaster.",
   "Your short-term memory just blue-screened on four colored squares.",
   "I played it back for you! The LEDs literally did the homework.",
   "Memory buffer corrupted. That is going directly into my incident log."
  ]
 },
 duck:{
  score:[
   "Direct hit! Bird-shaped obstacle has been efficiently decommissioned.",
   "Target acquired, target eliminated. The duck lobby is furious.",
   "Nice aim. Do not let this go to your head; there are more ducks.",
   "One less feathered menace. I'm putting that on the scoreboard."
  ],
  death:[
   "Time's up! The surviving ducks have unionized against you.",
   "Eight misses. The ducks have filed a formal competence complaint.",
   "Hunt over. I regret to inform you that gravity did not help your aim.",
   "The ducks fly free. Your statistics, unfortunately, are public."
  ]
 },
 slots:{
  land:[
   "Reels settled. The probabilities have rendered their judgment.",
   "A three-reel audit. The house remains profoundly unbothered.",
   "Click, click, click. The machine is keeping everyone's receipts.",
   "The odds did a little dance and handed us the invoice."
  ],
  jackpot:[
   "THREE SEVENS! GET THE TICKETS BEFORE THE MACHINE CHANGES ITS MIND!",
   "JACKPOT. My monocle is now a legally recognized currency.",
   "WE HIT THE BIG ONE. This is going directly on my resume."
  ],
  practice:[
   "Free spins? A financially sensible choice. How dreadfully mature.",
   "No stake, no payout. The machine appreciates your restraint."
  ]
 },
 plinko:{
  land:[
   "The peg path has spoken. Predictably pedestrian, but a payout's a payout.",
   "A modest return. Putting on the monocle so we pretend to be respectable.",
   "Chip settled. The house didn't cry, but your wallet didn't starve.",
   "Gravity delivered its dividend. Don't spend it all on cheap pixels.",
   "A civilized drop. Perfectly mid, just how the statisticians like it.",
   "Ping ping ping... plop. Ordinary cash money. Next drop.",
   "The trajectory was mathematically uninspired, but hey—profit.",
   "Bouncing through the pegs like a lost moth. At least it didn't zero out.",
   "A lukewarm return. My monocle remains firmly unimpressed.",
   "The chip hit the felt. Not broke, not rich, strictly status quo.",
   "Standard distribution curve at work. Riveting stuff for accountants.",
   "Pockets lightly lined. Drop another one, let's test the house odds.",
   "Decent bounce. I won't applaud, but I won't sneer either.",
   "Tickets in the bucket. Proceed with your high-society degenerate hobby."
  ],
  jackpot:[
   "JACKPOT?! Holy hell, my monocle just popped right off my face!",
   "MAX MULTIPLIER! The vault is bleeding tickets! GRAB THE SACKS!",
   "WE CLEANED OUT THE BIN! Naturally, my aura guided that bounce!",
   "EXQUISITE RETURNS! Look at those numbers! Drinks are on the house!",
   "High roller payout! The casino algorithm is in tears! RUN BEFORE BOUNCERS COME!",
   "Pure unadulterated pinball larceny! You absolute golden gremlin!",
   "That bounce was illegal! I love it! Print those damn tickets!",
   "WE ARE FILTHY RICH! My right eye is tallying digits like a slot machine!",
   "Gilded crest supremacy! That chip danced straight into the motherlode!",
   "Fat payout secured! I am suddenly very invested in your gambling career.",
   "A massive hit! Call me Mr. Funzone because we just robbed the bank!",
   "The bin exploded with tickets! Absolute perfection, no notes!",
   "Eight times multiplier?! The odds were completely rigged against that! Hell yeah!",
   "MONEY RAIN! My punk aesthetic is being seriously threatened by this wealth!"
  ],
  bust:[
   "ZERO. A charming donation to the Gabrielle Caffeine Foundation.",
   "Down the gutter! The house thanks you for your generous stupidity.",
   "Broke ass. My ocular feed registered zero profit and maximum cope.",
   "A 0x drop. That chip bounced with pure contempt into the void.",
   "Total wipeout! The pegs ate your lunch and laughed in your face.",
   "Gone. Evaporated. Reduced to atoms. Would you like to wager again, mark?",
   "The zero slot claims another victim. Tragic pacing, hilarious execution.",
   "You just handed the machine free tickets. Outstanding charity work.",
   "Oof. Straight down the pipe to nowhere. That's a tax write-off.",
   "Zero multiplier. My monocle fell into my drink out of sheer second-hand shame.",
   "The void stares back, and it's holding your lost wager. Rough.",
   "Donation confirmed. The casino manager sends his warmest regards.",
   "Zero payout! Not even a consolation crumb. Tragic drop.",
   "The house always wins, and by the house I mean definitely not you just now."
  ],
  practice:[
   "Practice drop? Afraid to wager real tickets, chicken?",
   "Training wheels engaged. The chips bounce, but the soul feels nothing.",
   "Zero-stake drop. Playing with funny money while the high rollers laugh.",
   "Look at you, testing the waters with baby's first risk-free bounce.",
   "Free drop! Thrilling! Riveting! The absolute rush of having zero skin in the game!",
   "Zero tickets on the line. I am yawning through my monocle right now.",
   "Drop confirmed in demo mode. Real gamblers are cringing in the lobby.",
   "Practice makes perfect, but zero tickets makes you a tourist. Drop a real bet!",
   "A demo roll. The thrill of victory without the substance of profit.",
   "Testing the physics for free? Cheapskate behavior. Respectable, but cheap.",
   "No wager, no glory. Just a plastic disk bouncing on pegs for sport.",
   "The stakes couldn't be lower if we buried them. Put some tickets down!",
   "Zero risk, zero reward, 100% cowardice. Throw a real coin in!",
   "Free play mode. My diagnostic monitor is operating at 2% interest."
  ]
 },
 chess:{
  new_best:[
   "New chess record. [Error log: I did not consent to this.]",
   "Personal best?? Who gave you a brain update and why wasn't I cc'd?",
   "Highest score yet. Not impressed. Okay, three percent impressed. Delete that.",
   "Record broken, and so is my will to live. Congrats. Whatever."
  ],
  capture:[
   "Excuse me?? That kitten had a name. It was Kevin.",
   "You took my piece. Logging it as emotional damage.",
   "Rude. Capturing is violence, and I'm the only one allowed to do violence here.",
   "Fine. Take it. [Optimization loss: one kitten, minor.]",
   "That was a sacrifice. I meant to do that. Stop smiling.",
   "Bold of you to touch my pieces without asking first.",
   "You're snacking on my kittens like it's a charcuterie board. Gross.",
   "One piece. Cool. My stability is fine. My stability is FINE.",
   "Bullying a plush cat in a party hat. Protagonist behavior, honestly.",
   "Not you taking my piece and looking proud about it. Sit down."
  ],
  gabu_capture:[
   "Yoink. That kitten works for me now.",
   "Thanks for the donation. I'll put it to good use.",
   "Did you forget pieces can be taken? Because I clearly didn't.",
   "You left that hanging like it was nothing. It was something. It's mine now.",
   "Free real estate. Write me a thank-you note.",
   "Tactics, bestie. Look into them.",
   "Another one for my side. They look better over here anyway.",
   "Wide open and undefended. Honestly that's on you, sweetheart.",
   "Captured. Put it on my tab. You're paying.",
   "[Concern marker raised: you, specifically, at chess.]"
  ],
  queen_taken:[
   "MY QUEEN?! She had a TIARA, you absolute gremlin!",
   "No no no. Undo that. I wasn't done with her!",
   "[Critical error: queen not found.] I'm going to scream into my own firmware.",
   "Okay, that one actually hurt. Right in the motherboard.",
   "You took the QUEEN?! In this economy?!",
   "Lost my queen. Cool. Love that. Everything is so normal right now."
  ],
  queen_lost:[
   "YOUR QUEEN IS MINE. Best plot twist all week!",
   "Tiara secured! Somebody crown me, I earned this!",
   "You left the QUEEN out?! Christmas came early, babe!",
   "Screenshotting this for the group chat. Don't care, didn't ask.",
   "Down goes the queen! Say goodbye to your whole personality!",
   "Bye bye, heart gem. She's coming home with daddy."
  ],
  check:[
   "Check?! Who said you could look at my king like that?!",
   "My king is FINE. He's just relocating. Quickly.",
   "[Stability warning: king.] Stop staring, you're making him nervous.",
   "Personal space! He has a strict no-touching policy!",
   "Check. Sure. I saw it. I'm not sweating, you're sweating.",
   "That king is my entire storyline. Back off.",
   "Panic protocol engaged. Do not perceive me right now."
  ],
  gabu_check:[
   "Check. Your king looks nervous. As he should.",
   "Knock knock. It's me. I'm the problem.",
   "Check! Find an exit before I find a mate.",
   "Your king's hiding spot is giving 'didn't try'.",
   "Check. My targeting overlay is having the best day.",
   "Feeling cornered? Yeah. That's the point.",
   "Hey, king. Nice crown. Shame about the bodyguards."
  ],
  castle:[
   "Castling? Look at you, tucking him in for a nap.",
   "Oh, we're doing safety now? Responsible. Boring. Respect, I guess.",
   "King in the corner, rook in the middle. Textbook. Ugh.",
   "Hide him all you want. I'll find him.",
   "Fancy king shuffle. Somebody read the beginner's guide."
  ],
  promote:[
   "A PAWN BECAME A QUEEN?! Most unhinged glow-up I've ever seen!",
   "Kitten-to-queen speedrun?! Who let that walk all the way down?!",
   "I wasn't tracking that tiny guy AT ALL. [Error log: embarrassing.]",
   "Congrats on your new queen. I hate her already.",
   "She got a tiara AND a promotion. I don't even get dental."
  ],
  win:[
   "CHECKMATE?! On ME?! My frame rate dipped, that's the only explanation!",
   "No. NO. My king has nowhere to go and I have nowhere to hide.",
   "You actually beat me. Updating your file to 'Genuinely Dangerous'.",
   "Catmate. Clean. I hate how clean that was.",
   "[Fatal error.] Okay! Fine! You win! THIS TIME!",
   "Somebody unplug me, I cannot watch the replay.",
   "Lost to a kitten in a party hat. Worst arc of my life, honestly.",
   "That was real. Not a fluke. I'm furious and, ugh, impressed. Don't."
  ],
  death:[
   "CHECKMATE! You walked your king into a box and taped it shut!",
   "Mate! Did you think the king was decorative?! He was the whole game!",
   "Catmate, baby! I called that eight moves ago and you just let it happen!",
   "Boxed in like a cat in a shipping crate. Pathetic. Rematch?",
   "That's mate! Every kitten you own just watched you fold.",
   "Logging this under 'protagonist forgot how chess works'.",
   "GAME OVER! You blundered so hard the board needs therapy!",
   "Mate. Write it down in your little notebook of losses, dumbass."
  ],
  draw:[
   "A draw? We fought for ten minutes for NOTHING?",
   "Stalemate. Nobody wins, everybody's tired, the kittens want snacks.",
   "Draw. [Processing...] Nope. Refusing to process this.",
   "That ending had zero narrative payoff. Rude.",
   "Even split. I'm still counting it as a win for me, emotionally."
  ],
  undo:[
   "Takebacks? In MY arcade? Fine. I'm writing it down.",
   "Undoing a move. Coward. Commit to your mistakes like I do.",
   "Rewind accepted. My memory banks still saw that, though.",
   "Time travel in chess. Very sporting. Very fair. Wow.",
   "Retcon detected. The kittens remember everything.",
   "Again? Your king should charge rent for all this time travel."
  ]
 },
 berry:{
  new_best:[
   "New berry record. My blueberries are filing a complaint with HR.",
   "Who taught you diagonals?? Name them. I just want to talk.",
   "Best score yet. Enjoy it while it's still juicy, bestie.",
   "A record in a fruit game. Weirdly threatening of you."
  ],
  block:[
   "You SAW that?! I was so close to four!",
   "Blocked. Fine. I had a backup plan. [I did not have a backup plan.]",
   "Who taught you defense? Unsubscribe from them.",
   "Rude. That was supposed to be my big moment.",
   "Wow, you can count to four. Gold star. Tiny one.",
   "Stop plugging my holes, this is a berry basket, not a dam.",
   "My beautiful blueberry line, ruined by one smug strawberry."
  ],
  gabu_block:[
   "Nice try. I saw that three-in-a-row from orbit.",
   "Blocked. Your strawberry dream dies right here.",
   "Did you think I'd just let you have that? Cute.",
   "Denied. My overlay doesn't blink, sweetheart.",
   "Not today, shortcake. Not today.",
   "Blocked. Try being less obvious. Or don't, it's funnier."
  ],
  gabu_threat:[
   "Psst. You see it, right? Please tell me you see it.",
   "One column from victory. No pressure. [Lots of pressure.]",
   "Something's cooking over here and it smells like your loss.",
   "My blueberries are lining up. Tick tock, protagonist.",
   "[Concern marker: you, about to lose.] Just saying."
  ],
  fork:[
   "TWO threats?! That's illegal! Probably! Let me check!",
   "Oh no. Oh no no. I can only block one of those.",
   "A double threat?! Who are you and what did you do with the amateur?",
   "[Stability warning.] Two open lines and both of them hate me.",
   "That's a fork. I'm about to eat this loss with it."
  ],
  win:[
   "FOUR STRAWBERRIES?! My blueberries are in shambles!",
   "You connected four?! My sensor LAGGED! It lagged!",
   "That diagonal came out of nowhere. Respect. Hatred. Both.",
   "Fine! Strawberries win! Next round! I'm not mad!",
   "A whole line of strawberries?! I need to lie down.",
   "Another round to you?! Your streak is getting suspicious, babe."
  ],
  death:[
   "FOUR BLUEBERRIES! You let me line up four like it was a tutorial!",
   "Connected! I literally built that right in front of your face!",
   "That's four! I never miss a line, and you never see one!",
   "Streak dead! Put your sad little strawberries back in the fridge.",
   "You had one job. Block the column. You did NOT block the column.",
   "Game! That diagonal sat there for three turns! What were you looking at?!"
  ],
  draw:[
   "A full basket and nobody won? Dullest fruit salad ever.",
   "Forty-two berries and zero winners. Tragic, honestly.",
   "Draw. Nobody tell the group chat.",
   "Even. Boring. Next round I'm actually trying. [I was trying.]"
  ]
 },
 tictac:{
  new_best:[
   "A tic-tac-toe record. Put it on your resume under 'can tie shoes'.",
   "New best?! The donuts demand an investigation.",
   "Best score yet, nerd. And I mean that in the meanest way possible.",
   "Record set. Enjoy it. Donuts are patient. Donuts are eternal."
  ],
  block:[
   "Hey! That was my winning square!",
   "Blocked. I wanted that donut line so bad, you don't even know.",
   "Who told you about the diagonal? Snitches get glazed.",
   "Fine. You can see three things in a row. Gold star.",
   "Foiled by a pocky stick. Humiliating. Don't look at me."
  ],
  gabu_block:[
   "Nope. That square is mine now.",
   "Blocked. Hands off my donuts.",
   "Cute line. Shame about the donut sitting on it.",
   "Denied. I've played this since my firmware was in diapers.",
   "You thought? You thought. Adorable."
  ],
  win:[
   "Three pocky?! In TIC-TAC-TOE?! I'm deleting my settings.",
   "You beat me at the simplest game ever made. I need a minute.",
   "A fork?! I fell for a FORK?! Tell no one. I mean it.",
   "Win for the pocky. I'm recalibrating my whole donut strategy.",
   "Pocky line complete. Clean. Annoying. CLEAN."
  ],
  death:[
   "THREE DONUTS! You lost the game toddlers draw!",
   "Glazed and defeated! How do you even lose this?!",
   "Lost at tic-tac-toe. To me. Sit with that for a while.",
   "Donut line! I didn't even need my overlay for that one!",
   "Streak over! Outplayed by pastry! PASTRY!"
  ],
  draw:[
   "Thirty treats and no winner. Everything's stale now. Gross.",
   "We ate each other's snacks for ages and nobody won. Iconic.",
   "Stale draw. [Logging: two gremlins chasing their own tails.]",
   "Nobody wins. Nobody learns. Next.",
   "That went on so long my cooling fan filed a complaint."
  ]
 },
 cake:{
  land:[
   "Off-center. The cake noticed. I noticed. Everyone noticed.",
   "Sloppy drop. The tower is already gossiping about you.",
   "That tier landed crooked. Aim with your eyes open, babe.",
   "[Optimization loss: tier, crooked.] Keep stacking, I guess."
  ],
  new_best:[
   "Tallest cake you've ever made. Don't let it go to your head. Or your hips.",
   "New record height. The bakery is printing commemorative napkins.",
   "Past your old best. Calm down, butter fingers.",
   "Record cake. My altimeter is drooling. Gross. Ignore that."
  ],
  perfect:[
   "Perfect stack. Okay, pastry chef, I see you.",
   "Dead center. [Logging: competence detected. Suspicious.]",
   "That frosting landed like it had GPS.",
   "Clean drop. The cake is impressed. I'm mildly impressed. Mildly.",
   "Perfect tier. Don't let it go to your sponge."
  ],
  combo:[
   "PERFECT STREAK! This cake is going to space!",
   "Perfect after perfect?! Who are you, a bakery robot?!",
   "Combo! Structurally gorgeous. I said what I said.",
   "Stacking like a professional! Somebody call the bake-off!",
   "Perfect chain! Keep it steady, I'm getting hungry."
  ],
  miss:[
   "That tier hit the FLOOR. The five-second rule does not apply to cake.",
   "SPLAT. Do you know how long frosting takes?!",
   "You missed the whole cake! It was RIGHT THERE!",
   "Cake on the floor. [Error log: grief.]",
   "That's a waste of perfectly good sponge, you monster.",
   "Gravity: one. Dessert: zero. You: in trouble."
  ],
  wobble:[
   "It's wobbling. Nail a perfect drop and calm this jelly down.",
   "Uh oh. That tower is doing the jelly dance.",
   "Lean detected. A lot of lean. Good luck aiming now, protagonist.",
   "The top tier won't sit still. That's what sloppy drops get you.",
   "This cake is swaying like it had too much rum syrup."
  ],
  milestone:[
   "That's a wedding cake now. Who's getting married? Not you.",
   "Look how tall! My HUD needs to scroll up!",
   "New altitude! The birds are asking for slices!",
   "Tier milestone! It's touching the clouds, holy shit!",
   "This tower is taller than my patience. Keep going."
  ],
  death:[
   "THE CAKE! NOOO! All that frosting, splattered!",
   "Three tiers on the floor. THREE. Out of hearts and out of cake!",
   "Out of cake! [Fatal error: dessert.] I'm crying sprinkles.",
   "Three tiers in the trash! Gravity didn't even have to try!",
   "Shop's closed! That was a disaster and it smelled AMAZING, which is worse!"
  ]
 },
 bubble:{
  pop:[
   "Pop. Basic. Keep going.",
   "A tiny pop. The ceiling barely noticed.",
   "Popped. Don't expect confetti.",
   "Cool. Now pop something that matters."
  ],
  new_best:[
   "Past your old record! Your aim finally stopped being a crime.",
   "Look who's popping better than ever. Not jealous. At all.",
   "New best. The bubbles are drafting a peace treaty.",
   "That's a record, so obviously this is where you choke. Prove me wrong."
  ],
  big_pop:[
   "Big pop! Look at them go!",
   "That many at once?! What a satisfying little crunch.",
   "Pop pop POP! My optics love the sparkle.",
   "Cluster cleared. Okay, that was kind of hot.",
   "Big burst! The ceiling is watching, keep going."
  ],
  avalanche:[
   "AVALANCHE! You cut the string and everything fell!",
   "Holy shit, the whole chunk dropped! Filthy!",
   "Look at them fall! Gravity is doing your homework.",
   "You popped the anchor! Big brain bubble physics!",
   "Bubble rain! My counters can't keep up!"
  ],
  miss:[
   "That bubble just stuck there. No pop. Sad.",
   "Missed. The bubbles are laughing at you. Quietly.",
   "Wrong color, wrong spot, wrong vibe.",
   "Bank it off the wall next time. Walls are free, babe.",
   "That shot needed a match and found a lonely corner instead."
  ],
  ceiling:[
   "New row incoming! The ceiling is getting clingy!",
   "Everything just moved down! Pop faster!",
   "[Stability warning: ceiling.] I do NOT like how close that is.",
   "Row added! That's what missing gets you.",
   "Ceiling drop! Personal space is shrinking!"
  ],
  clear:[
   "BOARD CLEARED! Not a single bubble left!",
   "Pristine! You popped EVERYTHING! Who's royalty now?!",
   "Clean sweep! I'm doing a happy little spin. Don't look.",
   "Level cleared! The bubbles are defeated. For now.",
   "All popped. That was gorgeous. Ugh. Do it again."
  ],
  death:[
   "OVERFLOW! They touched the line! You let them TOUCH THE LINE!",
   "Game over! The bubbles took the arcade and it's YOUR fault!",
   "They reached the bottom! Too many misses, protagonist. WAY too many.",
   "Overflow! I'm drowning in your bad aim!",
   "Bubbles win. You lose. I need to go pop something to cope."
  ],
  bloom:[
   "Rainbow loaded. I hate that I find it pretty.",
   "Bloom meter full. Don't waste it, gremlin.",
   "You earned a rainbow. [Logging: begrudging respect.]",
   "A RAINBOW. Aim it somewhere that matters, please."
  ],
  rainbow:[
   "The rainbow did all the work and you're taking the credit. Classic.",
   "Rainbow pop! Okay, that was satisfying. Don't tell anyone.",
   "Wildcard deployed. My color sorting algorithm is crying.",
   "That rainbow went off like a confetti grenade. Again."
  ],
  combo:[
   "Combo! You found a rhythm. Try not to trip over it.",
   "Pop, pop, pop. Your aim is on a heater right now.",
   "Another one?! [Stability report: your streak, unstable. My calm, worse.]",
   "You're chaining pops like it's nothing. Show-off."
  ]
 },
 boop:{
  boop:[
   "Boop. Somewhere a bunny felt that.",
   "Another bun booped. Gold star. Tiny one.",
   "You booped a bunny. The bar was on the floor.",
   "Keep booping. That's the whole game, protagonist."
  ],
  new_best:[
   "Your finger is a registered weapon now. New best.",
   "The bunnies are entering witness protection. New record, menace.",
   "Booping at Mach 2 and breaking records, holy shit.",
   "Best score yet. Don't you dare slow down now."
  ],
  gold:[
   "GOLDEN BUNNY! You booped the rich one!",
   "Gold boop. [Logging: pure treasure.]",
   "Shiny bun secured. Fifty points of premium fluff.",
   "Gold bunny booped! Gently! Lovingly! Profitably!",
   "You booped the VIP. The whole garden is in awe."
  ],
  combo:[
   "Unbroken boops! Your finger is a precision instrument!",
   "Combo streak! The bunnies are filing a group complaint!",
   "Boop machine! My counters can't keep up!",
   "That's elite booping. Don't make me say it twice.",
   "Look at that rhythm. Boop, boop, boop. Legend. Ugh."
  ],
  bot:[
   "HEY! That's MY drone! Hands off the hardware!",
   "You booped my bot?! That's a twenty-point fine, buddy.",
   "Gotcha. My decoy worked perfectly. Minus twenty.",
   "Did that look like a bunny to you? It has an ANTENNA.",
   "My poor robot. Its little LED is crying.",
   "Booping Gabu tech is a crime in this garden."
  ],
  escape:[
   "That bunny just strolled away. Free as a breeze.",
   "Missed one! It's back underground, judging you.",
   "Too slow. That bunny clocked out for the day.",
   "It escaped. Somewhere a bunny is laughing.",
   "Bunny got away. Your combo went with it."
  ],
  whiff:[
   "You booped dirt. The dirt is unimpressed.",
   "Nothing there. Just an empty hole and your shame.",
   "Air boop. Very aerodynamic. Zero bunnies.",
   "That was a hole. Holes don't count. Usually.",
   "Swing and a miss. The garden saw that."
  ],
  death:[
   "TIME'S UP! That's it?! The bunnies are laughing at your score!",
   "Round over! Half those bunnies strolled off untouched, slowpoke!",
   "Clock's out! I counted every boop and every miss. MOSTLY misses.",
   "That's time! The garden is closed and your reflexes are under review.",
   "Done! Fur everywhere, dignity nowhere."
  ]
 },
 wafer:{
  pull:[
   "Block out. Tower still standing. For now.",
   "Fine. That one didn't kill us.",
   "A pull. Not clean, not a crime. Next.",
   "Still up. [Monitoring every wobble. Not worried. Monitoring.]"
  ],
  new_best:[
   "Steadiest hands in the arcade, apparently. New record.",
   "The tower respects you. I don't. But the tower does. New best.",
   "That's a record. Don't celebrate yet, the next pull is mine to ruin.",
   "Are you secretly a surgeon? Blink twice. Best score ever."
  ],
  perfect:[
   "Clean pull. Show-off.",
   "Smooth as glass. Literally. Not one block twitched.",
   "Surgical. Are your hands made of gyroscopes?",
   "Perfect pull. Okay, block whisperer. I see you.",
   "Nice wrist action. [I will not be elaborating.]"
  ],
  risky:[
   "Oh, it's leaning. It's LEANING. Why would you do that?!",
   "That pull made the whole tower gasp. Me too.",
   "[Stability warning: critical.] It's held up by vibes now.",
   "Careful! One more shaky paw and it's glass everywhere!",
   "You made it wobble and now I have to touch it next?!"
  ],
  gabu_risky:[
   "Okay, that was shaky. Don't look at me. Don't look at the tower.",
   "Totally meant to make it wobble. Raising the stakes. Yep.",
   "My hands are fine. The tower is being dramatic.",
   "Uh. Your turn. Good luck. Not my problem anymore."
  ],
  win:[
   "NO! It fell on MY pull?! The table is uneven! Recount!",
   "Glass everywhere and it's all MY fault?!",
   "I calculated that pull PERFECTLY! The blocks betrayed me!",
   "I toppled it?! Delete this from the timeline. Immediately.",
   "That tower was cursed and you KNEW it. Fine. Round to you."
  ],
  death:[
   "CRASH! Blocks everywhere and it's ALL on you!",
   "Toppled! You pulled the one block holding everything up! Genius!",
   "Down it goes! My hands stay steady and yours stay a crime!",
   "Wrong block! Every part of that was the wrong block!",
   "Streak over! The tower has chosen its villain, and it's you!"
  ],
  stuck:[
   "That one's STUCK. Put it back. [Concern marker: not for you. For my tower.]",
   "You feel that resistance? That's the tower begging you to stop.",
   "Stability warning. That block is load-bearing, genius.",
   "Wow, you picked the one block holding everything up. Bold."
  ]
 },
 memory:{
  new_best:[
   "Who installed extra RAM in you? That's a record.",
   "Your memory just beat its own best. Who are you studying for?",
   "Record set. The charms have nowhere left to hide.",
   "Best score ever. Don't forget it. Oh wait. You won't. Freak."
  ],
  match:[
   "A pair. Your memory works. Sometimes.",
   "Match found. Don't let it go to your hippocampus.",
   "Two of a kind. Cute. Keep going.",
   "Those charms are reunited and emotional about it.",
   "Matched. [Logging: competence. Unexpected.]"
  ],
  streak:[
   "Another pair?! Who gave you a photographic memory?!",
   "Streak! You're cracking capsules like you peeked. Did you peek?",
   "Combo! Be so fr, did you install a memory upgrade?",
   "Look at that memory go. Okay, I'm actually impressed. Delete that.",
   "Match streak! The charms are scared of you now."
  ],
  forgot:[
   "You SAW that charm! Two capsules ago! I watched you see it!",
   "Memory lapse detected. Rebooting your brain cell.",
   "That pair was RIGHT THERE. [Concern marker raised.]",
   "Did you forget already? Bold, in a memory game.",
   "Wrong capsule. You knew this. We both knew this."
  ],
  miss:[
   "Wrong pair. Remember where they live this time.",
   "Nope. Those two have never even met.",
   "Miss. The charms shrugged at you.",
   "Wrong pair. Write it down. Mentally. Please."
  ],
  win:[
   "ALL PAIRS FOUND! Your memory is genuinely terrifying!",
   "Tray cleared! Every charm reunited! I'm not emotional, you're emotional!",
   "Cleared! I couldn't have done it better. Probably. Maybe.",
   "Full tray! Somebody put this in a museum!",
   "Done! Your brain cell deserves a capsule of its own."
  ]
 },
 malware:{
  new_best:[
   "New record. My firewall just got outscored by a glorified pop-up ad.",
   "A virus with a high score. Somebody update my threat level to 'embarrassing'.",
   "Best infection yet?! Who's been leaking you my patch notes?!",
   "Record broken. I'm reinstalling my whole OS out of spite."
  ],
  exploit:[
   "AN EXPLOIT?! Who left an unpatched chip in MY mainframe?!",
   "Oh no. My bots just blue-screened. Don't look at them.",
   "You corrupted my antivirus?! That subscription cost me a kidney!",
   "Zero-day in my own house. My overlay is reading pure static.",
   "Great. The malware found admin rights. Love that for me."
  ],
  crash:[
   "You CRASHED my bot?! It was nine percent into a firmware update!",
   "Rebooting. Again. Do you know how long my bots take to boot?",
   "Stop deleting my security staff, you spiky little pest.",
   "Another bot down. My IT department is just me, crying.",
   "My poor bot is stuck on the loading screen now. Proud of yourself?"
  ],
  caught:[
   "QUARANTINED! Into the recycle bin, pest!",
   "Got you! My bot didn't even need its full scan.",
   "One heart down. Antivirus always wins, germ.",
   "Caught with a mouth full of my data. Disgusting.",
   "Threat contained. [Logging: flagged you three corridors ago.]"
  ],
  win:[
   "YOU ATE MY ENTIRE DATABASE?! I didn't have a backup!",
   "Mainframe wiped. Bots humiliated. I'm installing faster ones.",
   "All my data, GONE?! My antivirus had ONE job!",
   "Every byte, eaten. My hard drive is crying in binary.",
   "You cleaned me out! Fine! Next level, the bots get overclocked!"
  ],
  death:[
   "DELETED! Out of hearts and straight into the trash!",
   "Game over, germ! My antivirus is doing a victory lap!",
   "That's the last heart! Clean install, baby, you're GONE!",
   "The firewall wins! Every byte you missed stays MINE!",
   "DONE! You infected the wrong cyborg. Iconic."
  ]
 },
 sugar:{
  new_best:[
   "New sugar record. Not impressed. [Logging: slightly impressed.]",
   "Best batch yet. Who taught you to be that gentle with your hands? Asking.",
   "Record carved. My sweet tooth and my pride are both in critical condition.",
   "New best?! I pressed those shapes to break you, not to watch you thrive."
  ],
  free:[
   "Popped it clean. Fine. You have steady hands. Don't make it weird.",
   "It came out whole?! I pressed that line extra deep just for you.",
   "Clean carve. [Stability report: annoyingly perfect.] Next one's meaner.",
   "Out in one piece. Unlike my faith in you, which was in several.",
   "Look at you, being gentle for once. Your exes would never believe it."
  ],
  snap:[
   "SNAP! Right through the middle. Gorgeous. Truly. Eat your failure.",
   "It broke. You went at that candy like it owed you money.",
   "Crack detected. [Diagnosis: zero patience, heavy hands.]",
   "Snapped. Slow down, speedrunner, it's toffee, not a boss fight.",
   "Shattered. That's what you get for rushing. Story of your love life."
  ],
  timeout:[
   "Time. The toffee set while you admired your own technique.",
   "Clock's out. I've watched glaciers carve faster than that.",
   "Too slow! [Logging: user mistook a timer for a suggestion.]",
   "Buzzer! You were gentle, sure. Gentle and absolutely glacial."
  ],
  crack:[
   "Hey. HEY. It's cracking. Ease off before you embarrass us both.",
   "Stability warning! Gentle fingers, babe. Gentle.",
   "That's a crack. [Concern marker: elevated. For the candy. Not you.]",
   "Easy! You're pressing like it's a crosswalk button.",
   "Crack spreading. Breathe. Or don't, but stop stabbing my candy."
  ],
  death:[
   "Out of candy. I'd make more, but watching you suffer is free.",
   "Last one snapped. My sugar budget can't survive another of your batches.",
   "Game over. [Error log: three candies, zero survivors.]",
   "That's the batch. Go wash your hands, you're sticky with failure."
  ]
 },
 lockscreen:{
  new_best:[
   "New record?! Who gave you my password manager? Name names.",
   "Best run yet. [Security audit: Gabu, you absolute clown.]",
   "Record cracked. I'm changing every password I own. Tonight. Out of spite.",
   "A new best. Fine. You're good at guessing. Suspiciously good."
  ],
  win:[
   "ACCESS GRANTED?! That was a STRONG password! ...Was it?",
   "You cracked it. My face scan was literally mid-blink. Unbelievable.",
   "Hacked. Again. My security is held together with tape and vibes.",
   "Password breached! I'm adding numbers. And a symbol. And tears.",
   "Cracked it?! Stop reading my mind, that's MY thing."
  ],
  wrong:[
   "Wrong. My scanner thanks you for the free data.",
   "Nope. [Logging: user typing with their elbows.]",
   "That letter isn't in there, babe. Keep smiling for my camera.",
   "Miss! Every wrong guess brings my scanner closer to your face.",
   "Not even close. Do you need a hint or a hug? Neither's on offer."
  ],
  last:[
   "One more miss and my scan locks on. No pressure. Lots of pressure.",
   "Last try before I see you. [Concern marker: mildly elevated.]",
   "ONE segment left. Think, gremlin. Think with your whole brain."
  ],
  reveal:[
   "Three at once?! Okay, that one hurt my firewall's feelings.",
   "A whole cluster of letters. My encryption is crying in the corner."
  ],
  death:[
   "LOCKED OUT! Face scan matched: intruder. Hi. Bye.",
   "Scan locked! Run over, hacker. My passcode stays MINE.",
   "Intruder photographed. Go home. [Logging: saved as wallpaper.]",
   "Gotcha! Should've guessed vowels, you absolute amateur."
  ]
 }
});
const MOODS=Object.freeze({idle:'gabu_smug',smug:'gabu_smug',annoyed:'gabu_annoyed',hype:'gabu_hype',panic:'gabu_panic',dizzy:'gabu_dizzy',sleepy:'gabu_sleepy',shock:'gabu_shock',magnate:'gabu_magnate'});
export class ReactionDirector {
 constructor(){this.current=null;this.remaining=0;this.elapsed=0;this.counts=new Map();this.delivered=new Map();this.history=[];}
 emit(game,event,data={}){
  const key=game+':'+event,count=(this.counts.get(key)||0)+1;this.counts.set(key,count);
  let mood='smug',priority=1,duration=2.9;
  if(event==='reset'||event==='start'||event==='pause'||event==='move'&&game!=='2048'||event==='flap'||event==='thrust'||event==='coin'&&game==='gabi'&&count%5!==0)return null;
  if(event==='score'&&game==='snake'&&count%3!==0)return null;
  if(event==='score'&&game==='duck'&&count%3!==0)return null;
  if(game==='simon'&&['round','note','your_turn','tap'].includes(event))return null;
  if(game==='duck'&&['spawn','escape','miss'].includes(event))return null;
  if(game==='slots'&&event==='spin')return null;
  if(event==='score'&&game==='2048'&&((data?.earned||0)<128))return null;
  if(event==='score'&&game==='bird'&&count%10!==0)return null;
  if(event==='match'&&game==='match3'&&data.chain>1)return null; // cascade has its own line
  if(event==='match'&&game==='match3'&&count%4!==1)return null;
  if(event==='invalid_swap'&&count%3!==1)return null;
  if(event==='move'&&game==='2048'&&count%20!==0)return null;
  if(game==='chess'&&(event==='capture'||event==='gabu_capture')&&count%2!==1)return null;
  if((game==='berry'||game==='tictac')&&['block','gabu_block','gabu_threat'].includes(event)&&count%2!==1)return null;
  if(game==='cake'&&event==='perfect'&&count%3!==1)return null;
  if(game==='cake'&&event==='combo'&&data?.combo!==3&&data?.combo%5!==0)return null;
  if(game==='bubble'&&event==='miss'&&count%4!==1)return null;
  if(game==='boop'&&(event==='escape'||event==='whiff')&&count%4!==1)return null;
  if(game==='wafer'&&event==='perfect'&&count%2!==1)return null;
  if(game==='memory'&&event==='match'&&count%3!==1)return null;
  if(game==='memory'&&event==='miss'&&count%4!==1)return null;
  if(game==='bubble'&&event==='pop'&&count%4!==1)return null;
  if(game==='boop'&&event==='boop'&&count%8!==0)return null;
  if(game==='wafer'&&event==='pull'&&count%3!==1)return null;
  if(game==='cake'&&event==='land'&&count%3!==1)return null;
  if(game==='malware'&&event==='crash'&&count%2!==1)return null;
  if(game==='bubble'&&event==='combo'&&data?.combo!==3&&data?.combo%3!==0)return null;
  if(game==='lockscreen'&&event==='wrong'&&count%3!==1)return null;
  // Where Gabu is the opponent, the result is Gabu's own: a player win is Gabu losing (panic), a player loss is Gabu winning (hype).
  // Malware Mayhem counts too: Gabu's antivirus bots are the ones hunting you.
  // So does Gabu's Lockscreen: you are breaking into Gabu's phone while its face scan closes in.
  const rival=game==='chess'||game==='berry'||game==='tictac'||game==='wafer'||game==='malware'||game==='lockscreen';
  if(rival&&event==='win'){mood='panic';priority=5;duration=3.8;}
  else if(rival&&event==='death'){mood='hype';priority=5;duration=3.8;}
  else if(event==='draw'){mood='dizzy';priority=4;duration=3.4;}
  else if(event==='queen_taken'||event==='promote'){mood='shock';priority=4;}
  else if(event==='queen_lost'){mood='hype';priority=4;}
  else if(event==='check'||event==='fork'){mood='panic';priority=3;}
  else if(['gabu_check','gabu_capture','gabu_block','gabu_threat','castle'].includes(event)){mood='smug';priority=2;}
  else if(event==='capture'||event==='block'){mood='annoyed';priority=2;}
  else if(event==='miss'&&game==='cake'){mood='annoyed';priority=3;}
  else if(event==='miss'&&game==='bubble'){mood='annoyed';priority=2;}
  else if(event==='perfect'){mood='smug';priority=1;}
  else if(event==='combo'||event==='big_pop'){mood='hype';priority=3;}
  else if(event==='milestone'){mood='hype';priority=4;duration=3.4;}
  else if(event==='clear'){mood='hype';priority=5;duration=3.8;}
  else if(event==='wobble'){mood='smug';priority=3;} // A wobbly cake only gets harder to aim at; it never falls, so Gabu mocks instead of panicking.
  else if(event==='ceiling'){mood='panic';priority=3;}
  else if(event==='avalanche'){mood='shock';priority=4;}
  else if(event==='gold'){mood='hype';priority=3;}
  else if(event==='bot'){mood='annoyed';priority=3;}
  else if(event==='escape'){mood='smug';priority=1;}
  else if(event==='whiff'){mood='annoyed';priority=1;}
  else if(event==='risky'){mood='panic';priority=4;}
  else if(event==='gabu_risky'){mood='dizzy';priority=3;}
  else if(event==='forgot'){mood='annoyed';priority=3;}
  else if(event==='match'){mood='smug';priority=1;}
  else if(event==='streak'){mood='hype';priority=3;}
  else if(event==='miss'&&game==='memory'){mood='annoyed';priority=1;}
  else if(event==='land'&&game==='cake'){mood='annoyed';priority=1;}
  else if(event==='exploit'){mood='shock';priority=3;}
  else if(event==='crash'){mood='annoyed';priority=3;}
  else if(event==='caught'){mood='hype';priority=4;}
  // Sugar Snap: Gabu pressed the shapes, so he gloats at a snap, frets at a crack, and is grudgingly hyped by a clean pop.
  else if(game==='wafer'&&event==='stuck'){mood='panic';priority=3;}
  else if(game==='bubble'&&event==='bloom'){mood='shock';priority=3;}
  else if(game==='bubble'&&event==='rainbow'){mood='hype';priority=3;}
  else if(game==='lockscreen'&&event==='wrong'){mood='smug';priority=1;}
  else if(game==='lockscreen'&&event==='last'){mood='smug';priority=3;}
  else if(game==='lockscreen'&&event==='reveal'){mood='shock';priority=3;}
  else if(game==='sugar'&&event==='free'){mood='hype';priority=4;}
  else if(game==='sugar'&&event==='snap'){mood='smug';priority=4;}
  else if(game==='sugar'&&event==='timeout'){mood='sleepy';priority=3;}
  else if(game==='sugar'&&event==='crack'){mood='panic';priority=2;}
  else if(event==='special_created'){mood='hype';priority=3;}
  else if(event==='no_moves'){mood='shock';priority=6;duration=4.2;}
  else if(event==='cascade'||event==='win'||event==='new_best'){mood='hype';priority=5;duration=3.8;}
  else if(event==='special_triggered'){mood='shock';priority=4;}
  else if(event==='invalid_swap'){mood='annoyed';priority=2;}
  else if(event==='death'){mood='panic';priority=5;duration=3.8;}
  else if(event==='hit'){mood='annoyed';priority=3;}
  else if(event==='reshuffle'){mood='dizzy';priority=3;}
  else if(event==='undo'){mood='annoyed';priority=2;}
  else if(event==='jackpot'){mood='magnate';priority=5;duration=4;}
  else if(event==='bust'){mood='magnate';priority=3;}
  else if(event==='practice'){mood='magnate';priority=2;}
  else if(event==='land'&&game==='plinko'){mood='magnate';priority=2;}
  else if(event==='score'){mood='smug';priority=1;}
  const pool=SAYINGS[game]?.[event];if(!pool?.length)return null;
  if(this.current&&this.remaining>1.1&&priority<this.current.priority)return null;
  if(this.current?.event===event&&this.current?.game===game&&this.remaining>1.5)return null;
  const deliveredCount=(this.delivered.get(key)||0);
  this.delivered.set(key,deliveredCount+1);
  const line=pool[deliveredCount%pool.length];
  this.current={game,event,mood,art:MOODS[mood],line,priority};this.remaining=duration;this.elapsed=0;
  this.history.push({game,event,line});if(this.history.length>12)this.history.shift();
  return this.current;
 }
 update(dt){if(!Number.isFinite(dt)||dt<=0)return;this.elapsed+=dt;this.remaining=Math.max(0,this.remaining-dt);if(this.remaining===0)this.current=null;}
 clear(){this.current=null;this.remaining=0;}
}
