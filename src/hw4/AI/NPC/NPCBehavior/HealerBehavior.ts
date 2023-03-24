import NPCActor from "../../../Actors/NPCActor";
import NPCBehavior from "../NPCBehavior";
import GoalReached from "../NPCStatuses/FalseStatus";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import Idle from "../NPCActions/GotoAction";
import { TargetExists } from "../NPCStatuses/TargetExists";
import BasicFinder from "../../../GameSystems/Searching/BasicFinder";
import { ClosestPositioned } from "../../../GameSystems/Searching/HW4Reducers";
import { AllyFilter, BattlerActiveFilter, BattlerGroupFilter, BattlerHealthFilter, ItemFilter, RangeFilter, VisibleItemFilter } from "../../../GameSystems/Searching/HW4Filters";
import PickupItem from "../NPCActions/PickupItem";
import UseHealthpack from "../NPCActions/UseHealthpack";
import Healthpack from "../../../GameSystems/ItemSystem/Items/Healthpack";
import Item from "../../../GameSystems/ItemSystem/Item";
import { HasItem } from "../NPCStatuses/HasItem";
import FalseStatus from "../NPCStatuses/FalseStatus";
import Battler from "../../../GameSystems/BattleSystem/Battler";
import GoapAction from "../../../../Wolfie2D/AI/Goap/GoapAction";
import GoapState from "../../../../Wolfie2D/AI/Goap/GoapState";


/**
 * When an NPC is acting as a healer, their goal is to try and heal it's teammates by running around, picking up healthpacks, 
 * bringing to the healthpacks to their allies and healing them.
 */
export default class HealerBehavior extends NPCBehavior  {

    /** The GameNode that owns this NPCGoapAI */
    protected override owner: NPCActor;
    
    /** Initialize the NPC AI */
    public initializeAI(owner: NPCActor, opts: Record<string, any>): void {
        super.initializeAI(owner, opts);

        let scene = owner.getScene();

        /* ######### Add all healer statuses ######## */

        this.addStatus(HealerStatuses.GOAL, new FalseStatus());

        // Check if a healthpack exists in the scene and it's visible
        this.addStatus(HealerStatuses.HPACK_EXISTS, new TargetExists(scene.getHealthpacks(), new BasicFinder<Item>(null, ItemFilter(Healthpack), VisibleItemFilter())));

        // Check if a healthpack exists in the actors inventory
        this.addStatus(HealerStatuses.HAS_HPACK, new HasItem(owner, new BasicFinder<Item>(null, ItemFilter(Healthpack))));

        // Check if a lowhealth ally exists in the scene
        let lowhealthAlly = new BasicFinder<Battler>(null, BattlerActiveFilter(), BattlerGroupFilter([owner.battleGroup]));
        this.addStatus(HealerStatuses.ALLY_EXISTS, new TargetExists(scene.getBattlers(), lowhealthAlly));
        
        /* ######### Add all healer actions ######## */

        // TODO configure the rest of the healer actions
        // Initialize healer statuses
        this.initializeStatuses();
        // Initialize healer actions
        this.initializeActions();

        /* ######### Set the healers goal ######## */

        this.goal = HealerStatuses.GOAL;
        this.initialize();
    }

    public override handleEvent(event: GameEvent): void {
        switch(event.type) {
            default: {
                super.handleEvent(event);
                break;
            }
        }
    }

    public override update(deltaT: number): void {
        super.update(deltaT);
    }

    protected initializeStatuses(): void {
        let scene = this.owner.getScene();

        // A status checking if there are any allies
        let allyBattlerFinder = new BasicFinder<Battler>(null, BattlerActiveFilter(), AllyFilter(this.owner), BattlerHealthFilter(0, 5))
        this.addStatus(HealerStatuses.ALLY_EXISTS, new TargetExists(scene.getBattlers(), allyBattlerFinder));

        // Add a status to check if a healthpack exists in the scene and it's visible
        this.addStatus(HealerStatuses.HPACK_EXISTS, new TargetExists(scene.getHealthpacks(), new BasicFinder<Item>(null, ItemFilter(Healthpack), VisibleItemFilter())));
        // Add a status to check if the healer has a healthpack
        this.addStatus(HealerStatuses.HAS_HPACK, new HasItem(this.owner, new BasicFinder(null, ItemFilter(Healthpack))));

        // Add the goal status 
        this.addStatus(HealerStatuses.GOAL, new FalseStatus());
    }

    protected initializeActions(): void {
        let scene = this.owner.getScene();

        //Use healthpack
        let useHealthpack = new UseHealthpack(this, this.owner);
        useHealthpack.targets = scene.getBattlers();
        useHealthpack.targetFinder = new BasicFinder<Battler>(ClosestPositioned(this.owner), BattlerActiveFilter(), AllyFilter(this.owner), BattlerHealthFilter(0, 5));
        useHealthpack.addPrecondition(HealerStatuses.ALLY_EXISTS);
        useHealthpack.addPrecondition(HealerStatuses.HAS_HPACK);
        useHealthpack.addEffect(HealerStatuses.GOAL);
        useHealthpack.cost = 1;
        this.addState(HealerActions.USE_HPACK, useHealthpack);

        // An action for picking up a healthpack
        let pickupHealthpack = new PickupItem(this, this.owner);
        pickupHealthpack.targets = scene.getHealthpacks();
        pickupHealthpack.targetFinder = new BasicFinder<Item>(ClosestPositioned(this.owner), VisibleItemFilter(), ItemFilter(Healthpack));
        pickupHealthpack.addPrecondition(HealerStatuses.HPACK_EXISTS);
        pickupHealthpack.addEffect(HealerStatuses.HAS_HPACK);
        pickupHealthpack.cost = 5;
        this.addState(HealerActions.PICKUP_HPACK, pickupHealthpack);

        // Idle action
        let idle = new Idle(this, this.owner);
        idle.addEffect(HealerStatuses.GOAL);
        idle.cost = 100;
        this.addState(HealerActions.IDLE, idle);
    }

    public override addState(stateName: HealerAction, state: GoapAction): void {
        super.addState(stateName, state);
    }

    public override addStatus(statusName: HealerStatus, status: GoapState): void {
        super.addStatus(statusName, status);
    }

}

// World states for the healer
export type HealerStatus = typeof HealerStatuses[keyof typeof HealerStatuses];
export const HealerStatuses = {

    // Whether or not a healthpack exists in the world
    HPACK_EXISTS: "hpack-exists",

    // Whether the healer has any allies in the game world or not
    ALLY_EXISTS: "ally-exists",

    // Whether the healer has a healthpack in their inventory or not
    HAS_HPACK: "has-hpack",

    // Whether the healer has reached its goal or not
    GOAL: "goal"

} as const;

// Healer actions
export type HealerAction = typeof HealerActions[keyof typeof HealerActions];
export const HealerActions = {

    PICKUP_HPACK: "pickup-hpack",

    USE_HPACK: "use-hpack",

    IDLE: "idle",

} as const;

