module challenge::robo_otter_lab {

    public enum BuildStatus has store, drop {
        STARTED,
        FINISHED
    }

    /// the object representing the Robo Otter! make sure to update the status to `FINISHED`
    public struct RoboOtter has key {
        id: object::UID,
        status: BuildStatus,
        firmware_version: u8,
        water_efficiency: u8,
    }

    public struct RoboOtterLab has key {
        id: object::UID,
    }

    public struct HydroTestTank has key {
        id: object::UID,
        required_efficiency: u8,
    }

    public struct ClawWrench has key {
        id: object::UID,
    }

    public struct Calibrator has key {
        id: object::UID,
    }

    public struct OtterExoFrame has key {
        id: object::UID,
    }

    public struct HydroJetPack {
        efficiency_bonus: u8,
    }

    public struct OtterOsFirmware {
        version: u8
    }

    const REQUIRED_OS_VERSION: u8 = 21;
    const REQUIRED_EFFICIENCY: u8 = 10;

    const ROBO_OTTER_NOT_BUILT: u64 = 1337;
    const INCORRECT_OS_VERSION: u64 = 1338;
    const INCORRECT_EFFICIENCY: u64 = 1339;

    fun init(ctx: &mut TxContext) {
        transfer::share_object(RoboOtter {
            id: object::new(ctx),
            status: BuildStatus::STARTED,
            firmware_version: 0,
            water_efficiency: 0,
        });
        transfer::share_object(RoboOtterLab {
            id: object::new(ctx),
        });
        transfer::share_object(HydroTestTank {
            id: object::new(ctx),
            required_efficiency: REQUIRED_EFFICIENCY,
        });
    }

    public fun prepare_tools(
        _lab        : &RoboOtterLab,
        user        : address,
        ctx         : &mut TxContext,
    ) {
        transfer::transfer(
            ClawWrench { id: object::new(ctx), },
            user
        );
        transfer::transfer(
            Calibrator { id: object::new(ctx), },
            user
        );
        transfer::transfer(
            OtterExoFrame { id: object::new(ctx), },
            user
        );
    }

    public fun build_robo_otter(
        robo_otter  : &mut RoboOtter,
        _lab        : &RoboOtterLab,
        test_tank   : &HydroTestTank,
        claw_wrench : ClawWrench,
        calibrator  : Calibrator,
        exo_frame   : OtterExoFrame,
        hydro_jet   : HydroJetPack,
        os          : OtterOsFirmware,
    ) {
        let OtterOsFirmware { version } = os;
        assert!(version == REQUIRED_OS_VERSION, INCORRECT_OS_VERSION);
        use_wrench(claw_wrench);
        calibrate(calibrator);
        put_exo_frame(exo_frame);
        test_tank.perform_tests(robo_otter, hydro_jet);
        robo_otter.firmware_version = version;
        robo_otter.status = BuildStatus::FINISHED;
    }

    public fun generate_firmware(_lab: &RoboOtterLab, version: u8): OtterOsFirmware {
        OtterOsFirmware { version }
    }

    public fun build_hydro_jet_pack(_lab: &RoboOtterLab, efficiency_bonus: u8): HydroJetPack {
        HydroJetPack { efficiency_bonus }
    }

    fun use_wrench(claw_wrench: ClawWrench) {
        let ClawWrench { id } = claw_wrench;
        id.delete();
    }

    fun calibrate(calibrator: Calibrator) {
        let Calibrator { id } = calibrator;
        id.delete();
    }

    fun put_exo_frame(exo_frame: OtterExoFrame) {
        let OtterExoFrame { id } = exo_frame;
        id.delete();
    }

    fun perform_tests(test_tank: &HydroTestTank, robo_otter: &mut RoboOtter, hydro_jet: HydroJetPack) {
        let HydroJetPack { efficiency_bonus } = hydro_jet;
        assert!(efficiency_bonus > test_tank.required_efficiency, INCORRECT_EFFICIENCY);
        robo_otter.water_efficiency = efficiency_bonus;
    }

    public fun check_robo_otter_build(robo_otter: &RoboOtter) {
        assert!(&robo_otter.status == BuildStatus::FINISHED, ROBO_OTTER_NOT_BUILT);
        assert!(robo_otter.firmware_version == REQUIRED_OS_VERSION, INCORRECT_OS_VERSION);
    }

}

