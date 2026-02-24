# Introduction
Create a top-down, 2D shooter game called "Post Office".
The game must be written in Javascript and run in a browser.
The game will draw inspiration from the classic computer game "Postal" but be set within an office tower building.

The player starts on the ground floor and each level is another floor up in the building.  
The player has to fight his way through the level to get to the elevator to take him up to the next level.  
Each level has a "boss" protecting the elevator which must be defeated before the player can level up.  The Boss will get harder to defeat with each level.

In addition to the boss, there are easier "soldier" enemies on each level to defeat as well as "innocents" NPCs who the player should not harm.

The player can turn and move using keyboard controls.
The player can use a weapon to kill NPCs. He can only use one weapon at a time but can switch between weapons if he has picked them up.

Both the Boss and the Soldiers can shoot back at the player, injuring the player. If the player has armor the armor will be reduced first, and then health when the armor is depleated.
If the players health reaches 0 then the player dies. If all the players lives are depleated then the game is over.

Levels will be pre-built and stored with the game data.

## Player Stats
The following is tracked for the player:

- Health (out of 100)
- Armor (out of 100)
- Number of lives (initially 3)
- Weapons held
- Ammo for each weapon


## Pickups
The player can pick up the following items in the game:
- Ammo
- Weapons (each weapon comes with some ammo)
- First Aid Kits to replenish health
- Armor replenishments
- Additional lives

## NPCs

### Soldier

Basic enemy NPC

- Weapon: Handgun (category 1), unlimited ammo
- Health: limited. Initially 100, will increase with each level
- Behaviour: moves towards the player if can see the player. Shoots at the player if in range.

### Boss

One per level, protects the elevator

- Weapon: starts with Handgun (category 1), increases as the levels increase. Unlimited ammo.
- Health: limited. Initially 100, will increase with each level.
- Behaviour: stays near the elevator, shoots at the player when in range.

### Innocent

Office workers caught up in the battle. 

- Weapon: none.
- Health: limited. Static
- Behaviour: Runs around in panic.

## Game view

The main game view is a top-down, 2d perspective.

As well as showing the level, player, NPCs and pickups the HUD will display:
- Level number
- Player stats (Health, Armor, Number of Lives)
- Which weapons are held and how much ammo for each.
    - A set of icons represent each weapon in a box
    - If the player does not hold that weapon, the box is empty
    - If the player does hold that weapon, the icon for that weapon is shown in the box
    - If the player does hold the weapon, but it is out of ammo, the icon for that weapon is greyed out
    - If the player does hold the weapon, and has ammo, the count of ammo held is also shown in the box
- Messages: short-lived messages when the player picks up a pickup or another event occurs

## Weapons

- Category 0: Hammer - melee weapon, unlimited ammo but close range only
- Category 1: Handgun
- Category 2: Shotgun
- Category 3: Machine Gun
- Category 4: Rocket launcher

Handgune and machine gun cause the same amount of damage per bullet but the machine gun shoots bullets much faster.

Shotgun causes more damage per bullet

Rocket launcher causes a lot of damage per bullet, but is slow to fire

## Graphics

The asthetic is arcade-game style graphics, focussing on fun gameplayer rather than realism.  

The game could use either sprite sheets or generated graphics.

NPCs are animated, can rotate and move.  All NPCs except Innocents can fire their weapons much are animated.

Bullets are animated, distinguishing bullets from different types of weapons. 


## Level Builder

To help generate levels there is a separate level builder component which is used only at development time.  The level builder has the ability to randomly generate levels which the developer can then edit and save into the game data.

The random generator will place the start point, the exit elevator, the boss, other NPCs and pickups in an initial configuratin. The developer can then edit the level in the level editor and save it into the game data.

The developer can load an existing level to edit it.