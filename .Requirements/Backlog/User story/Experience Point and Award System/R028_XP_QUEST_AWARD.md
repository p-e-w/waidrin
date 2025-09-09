----Do not modify this template----
###Story No###
*R028_XP_QUEST_AWARD*

##Business requirements##
###1-line summary###
Award experience points to characters for completing quests or milestones.
###Description###
The system should allow the Game Master to award experience points (XP) to characters for completing non-combat objectives, quests, or significant milestones, as an alternative or supplement to monster XP.
###Business Value###
Encourages roleplaying, problem-solving, and engagement with the narrative, providing flexible progression options beyond combat.

###User story###
As a Game Master
when players complete a quest or achieve a significant milestone
I want to be able to award experience points to the characters
so that their non-combat achievements contribute to their progression.

###Acceptance criteria###
Given a quest or milestone is completed with a defined XP award
When the Game Master awards XP for the quest/milestone
Then the specified XP amount is added to each participating character's total experience points.

Scenario 1: Awarding XP for a completed quest
Given a party completes a quest with a 500 XP reward
When the XP is awarded
Then each character gains 500 XP.