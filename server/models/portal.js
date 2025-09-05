/**
 * Connects two location ONE WAY.
 *
 * Example: two adjacent rooms connected by a door:
 *          Room A has a portal to Room B, and
 *          Room B has a portal to Room A.
 *
 *  @todo Add encounters to portals
 */
export class Portal {
    /**
     * Target Location.
     */
    _targetLocationId;

    /**
     * Description shown to the player when they inspect the portal from the source location.
     */
    _description;

    /**
     * Description shown to the player when they traverse the portal.
     */
    _traversalDescription;
}
