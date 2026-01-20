# Claude Code Development Notes

## Jump Mechanics Implementation (2026-01-19)

### Overview
Implemented realistic jump functionality for the WW2 FPS using minimal custom physics extension. Player can now press spacebar to jump with authentic movement physics.

### Features Implemented
- **Jump Height**: ~1.2m (realistic WW2 soldier with gear)
- **Controls**: Spacebar to jump
- **Cooldown**: 600ms between jumps to prevent bunny-hopping
- **Air Control**: Limited lateral movement (30% speed) while airborne
- **Restrictions**: Cannot jump while aiming down sights
- **Fall Damage**: Triggers above 3m with visual red overlay effect
- **Ceiling Collision**: Prevents jumping through geometry

### Technical Details
**File Modified**: `src/index.js`

**Physics Constants** (lines 305-311):
- `GRAVITY = 20.0` - Higher than realistic 9.8 for snappier feel
- `JUMP_VELOCITY = 4.9` - Calculated for desired jump height
- `AIR_CONTROL_FACTOR = 0.3` - Reduces movement control while airborne
- `FALL_DAMAGE_THRESHOLD = 3.0` - Meters before damage starts
- `FALL_DAMAGE_MULTIPLIER = 10` - Damage scaling

**Methods Added**:
- `attemptJump()` - Validates conditions and initiates jump
- `checkGroundCollision()` - Raycasting-based ground/ceiling detection
- `handleFallDamage()` - Calculates damage from falls
- `showFallDamageEffect()` - Visual red overlay feedback

**Integration Points**:
- Gravity applied in `updatePlayerPosition()` each frame
- Movement speed modified based on grounded state
- Network synchronization ready (velocityY can be added to updates)

### Architecture Decisions
- Used existing custom physics system (no external engine)
- Consistent with lightweight Three.js approach
- Raycasting for collision detection matches existing patterns
- Future-ready for sound effects and health system integration

### Testing Notes
All verification tests passed:
- Basic jump mechanics work correctly
- Cooldown prevents spam jumping
- ADS properly blocks jumping
- Air control feels realistic
- Fall damage triggers appropriately
- Ceiling collision stops upward movement

### Future Enhancements
- Jump sound effects (TODO comments added)
- Health system integration for fall damage
- Multiplayer jump state synchronization
- Carry weight system affecting jump height
- Jump animations for player model/weapon

---
*Generated with Claude Code*
