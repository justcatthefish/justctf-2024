module solution::solution {

    use challenge::robo_otter_lab::{
        RoboOtter,
        RoboOtterLab,
        HydroTestTank,
        ClawWrench,
        Calibrator,
        OtterExoFrame,
    };

    public fun solve(
        /* TODO: other params */
        robo_otter      : &mut RoboOtter,
        lab             : &RoboOtterLab,
        test_tank       : &HydroTestTank,
        claw_wrench     : ClawWrench,
        calibrator      : Calibrator,
        exo_frame       : OtterExoFrame,
        _ctx            : &mut TxContext
    ) {
        let hydro_jet = lab.build_hydro_jet_pack(11);
        let os = lab.generate_firmware(21);
        robo_otter.build_robo_otter(lab, test_tank, claw_wrench, calibrator, exo_frame, hydro_jet, os);
    }

}
