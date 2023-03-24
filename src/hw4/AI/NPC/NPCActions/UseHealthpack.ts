import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import Battler from "../../../GameSystems/BattleSystem/Battler";
import Healthpack from "../../../GameSystems/ItemSystem/Items/Healthpack";
import { TargetableEntity } from "../../../GameSystems/Targeting/TargetableEntity";
import NPCActor from "../../../Actors/NPCActor";
import NPCBehavior from "../NPCBehavior";
import NPCAction from "./NPCAction";
import Finder from "../../../GameSystems/Searching/Finder";
import { ItemEvent } from "../../../Events";


export default class UseHealthpack extends NPCAction {
    protected healthpack: Healthpack | null;
    // The targeting strategy used for this GotoAction - determines how the target is selected basically
    protected override _targetFinder: Finder<Battler>;
    // The targets or Targetable entities 
    protected override _targets: Battler[];
    // The target we are going to set the actor to target
    protected override _target: Battler | null;

    public constructor(parent: NPCBehavior, actor: NPCActor) { 
        super(parent, actor);
        this.healthpack = null;
    }

    public performAction(target: Battler): void {
        if (this.healthpack !== null && this.healthpack.inventory !== null && this.healthpack.inventory.id === this.actor.inventory.id) {
            this.emitter.fireEvent(ItemEvent.CONSUMABLE_USED, {
                actorId: this.actor.id,
                targetId: target.id
            });
            
            this.actor.inventory.remove(this.healthpack.id);
        }
        this.finished();
    }

    public onEnter(options: Record<string, any>): void {
        super.onEnter(options);
        // Find a healthpack in the actors inventory
        let healthpack = this.actor.inventory.find(item => item.constructor === Healthpack);
        if (healthpack !== null && healthpack.constructor === Healthpack) {
            this.healthpack = healthpack;
        }
    }

    public handleInput(event: GameEvent): void {
        switch(event.type) {
            default: {
                super.handleInput(event);
                break;
            }
        }
    }

    public update(deltaT: number): void {
        super.update(deltaT);
    }

    public onExit(): Record<string, any> {
        // Clear the reference to the lasergun
        this.healthpack = null;
        return super.onExit();
    }
}