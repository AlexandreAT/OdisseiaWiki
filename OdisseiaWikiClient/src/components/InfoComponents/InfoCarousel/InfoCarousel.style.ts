import styled from 'styled-components';

interface StyleProps {
    colorScheme: {
        primary: string;
        primaryClear: string;
        primaryDeep: string;
        secondary: string;
        secondaryClear: string;
        secondaryDeep: string;
    };
    imageStyleTop?: 'circle' | 'rectangle';
    imageStyleBottom?: 'circle' | 'rectangle';
    type?: 'simple' | 'city';
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

const ContainerWiki = styled.div<StyleProps>`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 10px;
    gap: 1rem;
    padding: 4rem 2rem 2rem;
    position: relative;
    transition: all 0.3s ease-in-out;

    background-color: var(--lightBlack);
    border: 2px solid var(${props => props.colorScheme.primary});

    ${props => props.neon === 'on' && `
        background-color: var(--black);
        border-color: white;
        box-shadow: 0px 0px 10px var(${props.colorScheme.primaryClear}), inset 0px 0px 10px var(${props.colorScheme.primaryClear});
        transition: all 0.3s ease-in-out;
    `}

    ${props => props.theme === 'light' && ` 
        ${props.colorScheme.primary === '--neonBlue' && `
            background-image: linear-gradient(to right top, #2a0385, #0e2995, #0040a0, #0054a8, #0066ac, #0078b7, #0089bf, #009ac6, #00b2d7, #00c9e5, #00e1f0, #08f9f6);
        `};
        ${props.colorScheme.primary === '--neonPink' && `
            background-image: radial-gradient(at 44.29273654938266% 66.71574153628141%, hsla(287.8756476683938, 76.89243027888446%, 49.21568627450981%, 1) 0%, hsla(287.8756476683938, 76.89243027888446%, 49.21568627450981%, 0) 100%), radial-gradient(at 89.09857269867427% 17.343536337125332%, hsla(316.70588235294116, 100%, 50%, 1) 0%, hsla(316.70588235294116, 100%, 50%, 0) 100%), radial-gradient(at 10.89067888711488% 47.96757526356896%, hsla(308.45070422535207, 100%, 13.92156862745098%, 1) 0%, hsla(308.45070422535207, 100%, 13.92156862745098%, 0) 100%), radial-gradient(at 60.929937071693566% 5.802171727221106%, hsla(307.9120879120879, 85.04672897196261%, 41.96078431372549%, 1) 0%, hsla(307.9120879120879, 85.04672897196261%, 41.96078431372549%, 0) 100%), radial-gradient(at 7.639141224266344% 7.572264579789234%, hsla(287.8756476683938, 76.89243027888446%, 49.21568627450981%, 1) 0%, hsla(287.8756476683938, 76.89243027888446%, 49.21568627450981%, 0) 100%), radial-gradient(at 51.7433007338892% 47.06240819469887%, hsla(316.70588235294116, 100%, 50%, 1) 0%, hsla(316.70588235294116, 100%, 50%, 0) 100%), radial-gradient(at 91.86106294603091% 35.786178907246494%, hsla(308.45070422535207, 100%, 13.92156862745098%, 1) 0%, hsla(308.45070422535207, 100%, 13.92156862745098%, 0) 100%), radial-gradient(at 6.385740512668936% 66.27068652125911%, hsla(307.9120879120879, 85.04672897196261%, 41.96078431372549%, 1) 0%, hsla(307.9120879120879, 85.04672897196261%, 41.96078431372549%, 0) 100%), radial-gradient(at 65.92422879529565% 0.9425629302210359%, hsla(287.8756476683938, 76.89243027888446%, 49.21568627450981%, 1) 0%, hsla(287.8756476683938, 76.89243027888446%, 49.21568627450981%, 0) 100%);
        `};
        ${props.colorScheme.primary === '--neonGreen' && `
            background-image: linear-gradient(to right top, #098200, #0d920e, #10a31b, #11b427, #10c533, #0bc538, #05c63d, #00c642, #00b640, #00a63e, #00963b, #018738);
        `};
        ${props.colorScheme.primary === '--neonRed' && `
            background-image: linear-gradient(to right top, #860f0f, #9c1810, #b32211, #ca2c0f, #e1370b, #e8390f, #ee3b13, #f53d16, #ed361f, #e43026, #db2b2c, #d22730);
        `};
        ${props.colorScheme.primary === '--neonYellow' && `
            background-image: radial-gradient(at 75.40223998441866% 46.02924950095097%, hsla(52.235294117647065, 100%, 50%, 1) 0%, hsla(52.235294117647065, 100%, 50%, 0) 100%), radial-gradient(at 18.403454839479227% 55.161321090157344%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 1) 0%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 0) 100%), radial-gradient(at 48.58774233812395% 16.43729172351076%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%), radial-gradient(at 83.43911517801746% 90.87036381400861%, hsla(61.99999999999999, 84.67741935483872%, 51.37254901960785%, 1) 0%, hsla(61.99999999999999, 84.67741935483872%, 51.37254901960785%, 0) 100%), radial-gradient(at 89.1151892818652% 71.2998892086037%, hsla(52.235294117647065, 100%, 50%, 1) 0%, hsla(52.235294117647065, 100%, 50%, 0) 100%), radial-gradient(at 82.86386703122312% 26.46653016969487%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 1) 0%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 0) 100%), radial-gradient(at 30.824236324833443% 70.83481317919072%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%), radial-gradient(at 49.97782409234499% 5.710329066247244%, hsla(61.99999999999999, 84.67741935483872%, 51.37254901960785%, 1) 0%, hsla(61.99999999999999, 84.67741935483872%, 51.37254901960785%, 0) 100%), radial-gradient(at 50.46059425429681% 8.382195761391454%, hsla(52.235294117647065, 100%, 50%, 1) 0%, hsla(52.235294117647065, 100%, 50%, 0) 100%), radial-gradient(at 61.85731396887395% 30.642190549888394%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 1) 0%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 0) 100%), radial-gradient(at 44.751561551284304% 40.92828518748446%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%);
        `};
        ${props.colorScheme.primary === '--neonViolet' && `
            background-image: linear-gradient(to right top, #6300ac, #6c00b3, #7501bb, #7e01c2, #8701c9, #870dc8, #8716c6, #871cc5, #7e25ba, #752caf, #6d30a4, #663399);
        `};
        border: 2px solid var(--lightBlack) !important;
        box-shadow: 0px 0px 20px 3px var(--lightBlack);
        transition: all 0.3s ease-in-out;
    `}

    ${props => props.theme === 'light' && props.neon === 'on' && `
        border: 2px solid white !important;
        ${props.colorScheme.primary === '--neonBlue' && `
            background-image: linear-gradient(to left bottom, #1b0257, #091963, #002a6c, #003872, #004676, #004a76, #004d75, #005074, #004a70, #00456c, #003f68, #033a64);
            box-shadow: 0px 0px 10px 2px var(--neonPink), inset 0px 0px 10px 2px var(--neonPink);
        `};
        ${props.colorScheme.primary === '--neonPink' && `
            background-image: radial-gradient(at 75.40223998441866% 36.02924950095097%, hsla(274.6153846153846, 100%, 10.196078431372548%, 1) 0%, hsla(274.6153846153846, 100%, 10.196078431372548%, 0) 100%), radial-gradient(at 18.403454839479227% 55.161321090157344%, hsla(270, 49.99999999999999%, 40%, 1) 0%, hsla(270, 49.99999999999999%, 40%, 0) 100%), radial-gradient(at 48.58774233812395% 16.43729172351076%, hsla(274.6153846153846, 100%, 10.196078431372548%, 1) 0%, hsla(274.6153846153846, 100%, 10.196078431372548%, 0) 100%), radial-gradient(at 83.43911517801746% 90.87036381400861%, hsla(274.6153846153846, 100%, 25.49019607843137%, 1) 0%, hsla(274.6153846153846, 100%, 25.49019607843137%, 0) 100%), radial-gradient(at 89.1151892818652% 71.2998892086037%, hsla(274.6153846153846, 100%, 10.196078431372548%, 1) 0%, hsla(274.6153846153846, 100%, 10.196078431372548%, 0) 100%), radial-gradient(at 82.86386703122312% 26.46653016969487%, hsla(270, 49.99999999999999%, 40%, 1) 0%, hsla(270, 49.99999999999999%, 40%, 0) 100%), radial-gradient(at 30.824236324833443% 70.83481317919072%, hsla(274.6153846153846, 100%, 10.196078431372548%, 1) 0%, hsla(274.6153846153846, 100%, 10.196078431372548%, 0) 100%), radial-gradient(at 49.97782409234499% 5.710329066247244%, hsla(274.6153846153846, 100%, 25.49019607843137%, 1) 0%, hsla(274.6153846153846, 100%, 25.49019607843137%, 0) 100%), radial-gradient(at 50.46059425429681% 8.382195761391454%, hsla(274.6153846153846, 100%, 10.196078431372548%, 1) 0%, hsla(274.6153846153846, 100%, 10.196078431372548%, 0) 100%), radial-gradient(at 61.85731396887395% 30.642190549888394%, hsla(270, 49.99999999999999%, 40%, 1) 0%, hsla(270, 49.99999999999999%, 40%, 0) 100%), radial-gradient(at 44.751561551284304% 40.92828518748446%, hsla(274.6153846153846, 100%, 10.196078431372548%, 1) 0%, hsla(274.6153846153846, 100%, 10.196078431372548%, 0) 100%);
            box-shadow: 0px 0px 10px 2px var(--neonYellow), inset 0px 0px 10px 2px var(--neonYellow);
        `};
        ${props.colorScheme.primary === '--neonGreen' && `
            background-image: linear-gradient(to right top, #00992c, #039526, #05901f, #078c18, #08880f, #078713, #078717, #07861a, #078926, #088b31, #0a8e3a, #0e9043);
            box-shadow: 0px 0px 10px 2px var(--neonRed), inset 0px 0px 10px 2px var(--neonRed);
            border: 2px solid var(--deepneonRed) !important;
        `};
        ${props.colorScheme.primary === '--neonRed' && `
            background-image: linear-gradient(to left bottom, #ae3000, #a72a04, #9f2308, #981d0b, #90170d, #8f1610, #8f1513, #8e1416, #94181b, #991b1f, #9f1f24, #a42229);
            box-shadow: 0px 0px 10px 2px var(--neonGreen), inset 0px 0px 10px 2px var(--neonGreen);
            border: 2px solid white !important;
        `};
        ${props.colorScheme.primary === '--neonYellow' && `
            background-image: radial-gradient(at 13.494393160826412% 49.14881520995156%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%), radial-gradient(at 90.89134521436331% 51.06148798398233%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 1) 0%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 0) 100%), radial-gradient(at 66.66993575639606% 34.59940862840265%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%), radial-gradient(at 45.8935237253224% 61.16258034457389%, hsla(46.86131386861314, 100%, 26.862745098039216%, 1) 0%, hsla(46.86131386861314, 100%, 26.862745098039216%, 0) 100%), radial-gradient(at 27.777738892016004% 97.43304176026544%, hsla(44.347826086956516, 100%, 18.03921568627451%, 1) 0%, hsla(44.347826086956516, 100%, 18.03921568627451%, 0) 100%), radial-gradient(at 48.47021279220951% 49.65594599965279%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%), radial-gradient(at 73.4344498033466% 97.43642927278384%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 1) 0%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 0) 100%), radial-gradient(at 28.52630191215524% 94.63323560333579%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%), radial-gradient(at 22.283326535927994% 80.20209210787954%, hsla(46.86131386861314, 100%, 26.862745098039216%, 1) 0%, hsla(46.86131386861314, 100%, 26.862745098039216%, 0) 100%);
            box-shadow: 0px 0px 10px 2px var(--clearneonViolet), inset 0px 0px 10px 2px var(--clearneonViolet);
            border: 2px solid var(--deepneonViolet) !important;
        `};
        ${props.colorScheme.primary === '--neonViolet' && `
            background-image: linear-gradient(to right top, #43025e, #40015d, #3d015c, #39005a, #360059, #37045a, #38085c, #390d5d, #3e1662, #441e66, #49266b, #4e2d6f);
            box-shadow: 0px 0px 10px 2px var(--clearneonViolet), inset 0px 0px 10px 2px var(--clearneonViolet);
            border: 2px solid white !important;
        `};
        transition: all 0.3s ease-in-out;
    `}

    @media (max-width: 768px) {
        padding: 4rem 1rem 2rem;
    }

    @media (max-width: 480px) {
        padding: 2.5rem 10px 2rem;
    }
`;

const Title = styled.h2<StyleProps>`
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    position: absolute;
    top: -30px;
    padding: 15px;
    border-radius: 10px;
    transition: all 0.3s ease-in-out;

    background-color: var(--lightBlack);
    border: 2px solid var(${props => props.colorScheme.primary});
    color: var(${props => props.colorScheme.primaryClear}) !important;

    ${props => props.neon === 'on' && `
        ${props.colorScheme.primary === '--neonBlue' && `
            background-color: var(--black);
            text-shadow: 1.5px 1.5px 3px var(${props.colorScheme.secondaryClear});
            border-color: white; 
            box-shadow: 0px 0px 10px var(${props.colorScheme.primaryClear}), inset 0px 0px 10px var(${props.colorScheme.primaryClear});
        `};
        ${props.colorScheme.primary === '--neonPink' && `
            background-color: var(--black);
            text-shadow: 1.5px 1.5px 3px var(${props.colorScheme.secondaryClear});
            border-color: white; 
            box-shadow: 0px 0px 10px var(${props.colorScheme.primaryClear}), inset 0px 0px 10px var(${props.colorScheme.primaryClear});
        `};
        ${props.colorScheme.primary === '--neonGreen' && `
            background-color: var(--black);
            text-shadow: 1.5px 1.5px 3px var(${props.colorScheme.secondaryClear});
            border-color: white; 
            box-shadow: 0px 0px 10px var(${props.colorScheme.primaryClear}), inset 0px 0px 10px var(${props.colorScheme.primaryClear});
        `};
        ${props.colorScheme.primary === '--neonRed' && `
            background-color: var(--black);
            text-shadow: 1.5px 1.5px 3px var(${props.colorScheme.secondaryClear});
            border-color: white; 
            box-shadow: 0px 0px 10px var(${props.colorScheme.primaryClear}), inset 0px 0px 10px var(${props.colorScheme.primaryClear});
        `};
        ${props.colorScheme.primary === '--neonYellow' && `
            background-color: var(--black);
            text-shadow: 1.5px 1.5px 3px var(${props.colorScheme.secondaryClear});
            border-color: white; 
            box-shadow: 0px 0px 10px var(${props.colorScheme.primaryClear}), inset 0px 0px 10px var(${props.colorScheme.primaryClear});
        `};
        ${props.colorScheme.primary === '--neonViolet' && `
            background-color: var(--black);
            text-shadow: 1.5px 1.5px 3px var(${props.colorScheme.secondaryClear});
            border-color: white; 
            box-shadow: 0px 0px 10px var(${props.colorScheme.primaryClear}), inset 0px 0px 10px var(${props.colorScheme.primaryClear});
        `};
        transition: all 0.3s ease-in-out;
    `}

    ${props => props.theme === 'light' && `
        ${props.colorScheme.primary === '--neonBlue' && `
            background-image: linear-gradient(to right top, #2a0385, #0e2995, #0040a0, #0054a8, #0066ac, #0078b7, #0089bf, #009ac6, #00b2d7, #00c9e5, #00e1f0, #08f9f6);
            border: 2px solid var(--lightBlack) !important;
            box-shadow: 0px 0px 20px 3px var(--lightBlack);
            color: var(--black) !important;
        `};
        ${props.colorScheme.primary === '--neonPink' && `
            background-image: radial-gradient(at 44.29273654938266% 66.71574153628141%, hsla(287.8756476683938, 76.89243027888446%, 49.21568627450981%, 1) 0%, hsla(287.8756476683938, 76.89243027888446%, 49.21568627450981%, 0) 100%), radial-gradient(at 89.09857269867427% 17.343536337125332%, hsla(316.70588235294116, 100%, 50%, 1) 0%, hsla(316.70588235294116, 100%, 50%, 0) 100%), radial-gradient(at 10.89067888711488% 47.96757526356896%, hsla(308.45070422535207, 100%, 13.92156862745098%, 1) 0%, hsla(308.45070422535207, 100%, 13.92156862745098%, 0) 100%), radial-gradient(at 60.929937071693566% 5.802171727221106%, hsla(307.9120879120879, 85.04672897196261%, 41.96078431372549%, 1) 0%, hsla(307.9120879120879, 85.04672897196261%, 41.96078431372549%, 0) 100%), radial-gradient(at 7.639141224266344% 7.572264579789234%, hsla(287.8756476683938, 76.89243027888446%, 49.21568627450981%, 1) 0%, hsla(287.8756476683938, 76.89243027888446%, 49.21568627450981%, 0) 100%), radial-gradient(at 51.7433007338892% 47.06240819469887%, hsla(316.70588235294116, 100%, 50%, 1) 0%, hsla(316.70588235294116, 100%, 50%, 0) 100%), radial-gradient(at 91.86106294603091% 35.786178907246494%, hsla(308.45070422535207, 100%, 13.92156862745098%, 1) 0%, hsla(308.45070422535207, 100%, 13.92156862745098%, 0) 100%), radial-gradient(at 6.385740512668936% 66.27068652125911%, hsla(307.9120879120879, 85.04672897196261%, 41.96078431372549%, 1) 0%, hsla(307.9120879120879, 85.04672897196261%, 41.96078431372549%, 0) 100%), radial-gradient(at 65.92422879529565% 0.9425629302210359%, hsla(287.8756476683938, 76.89243027888446%, 49.21568627450981%, 1) 0%, hsla(287.8756476683938, 76.89243027888446%, 49.21568627450981%, 0) 100%);
            border: 2px solid var(--lightBlack) !important;
            box-shadow: 0px 0px 20px 3px var(--lightBlack);
            color: var(--black) !important;
        `};
        ${props.colorScheme.primary === '--neonGreen' && `
            background-image: linear-gradient(to right top, #098200, #0d920e, #10a31b, #11b427, #10c533, #0bc538, #05c63d, #00c642, #00b640, #00a63e, #00963b, #018738);
            border: 2px solid var(--lightBlack) !important;
            box-shadow: 0px 0px 20px 3px var(--lightBlack);
            color: var(--black) !important;
        `};
        ${props.colorScheme.primary === '--neonRed' && `
            background-image: linear-gradient(to right top, #860f0f, #9c1810, #b32211, #ca2c0f, #e1370b, #e8390f, #ee3b13, #f53d16, #ed361f, #e43026, #db2b2c, #d22730);
            border: 2px solid var(--lightBlack) !important;
            box-shadow: 0px 0px 20px 3px var(--lightBlack);
            color: var(--black) !important;
        `};
        ${props.colorScheme.primary === '--neonYellow' && `
            background-image: radial-gradient(at 75.40223998441866% 46.02924950095097%, hsla(52.235294117647065, 100%, 50%, 1) 0%, hsla(52.235294117647065, 100%, 50%, 0) 100%), radial-gradient(at 18.403454839479227% 55.161321090157344%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 1) 0%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 0) 100%), radial-gradient(at 48.58774233812395% 16.43729172351076%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%), radial-gradient(at 83.43911517801746% 90.87036381400861%, hsla(61.99999999999999, 84.67741935483872%, 51.37254901960785%, 1) 0%, hsla(61.99999999999999, 84.67741935483872%, 51.37254901960785%, 0) 100%), radial-gradient(at 89.1151892818652% 71.2998892086037%, hsla(52.235294117647065, 100%, 50%, 1) 0%, hsla(52.235294117647065, 100%, 50%, 0) 100%), radial-gradient(at 82.86386703122312% 26.46653016969487%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 1) 0%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 0) 100%), radial-gradient(at 30.824236324833443% 70.83481317919072%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%), radial-gradient(at 49.97782409234499% 5.710329066247244%, hsla(61.99999999999999, 84.67741935483872%, 51.37254901960785%, 1) 0%, hsla(61.99999999999999, 84.67741935483872%, 51.37254901960785%, 0) 100%), radial-gradient(at 50.46059425429681% 8.382195761391454%, hsla(52.235294117647065, 100%, 50%, 1) 0%, hsla(52.235294117647065, 100%, 50%, 0) 100%), radial-gradient(at 61.85731396887395% 30.642190549888394%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 1) 0%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 0) 100%), radial-gradient(at 44.751561551284304% 40.92828518748446%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%);
            border: 2px solid var(--lightBlack) !important;
            box-shadow: 0px 0px 20px 3px var(--lightBlack);
            color: var(--black) !important;
        `};
        ${props.colorScheme.primary === '--neonViolet' && `
            background-image: linear-gradient(to right top, #6300ac, #6c00b3, #7501bb, #7e01c2, #8701c9, #870dc8, #8716c6, #871cc5, #7e25ba, #752caf, #6d30a4, #663399);
            border: 2px solid var(--lightBlack) !important;
            box-shadow: 0px 0px 20px 3px var(--lightBlack);
            color: var(--black) !important;
        `};
        transition: all 0.3s ease-in-out;
    `}

    ${props => props.theme === 'light' && props.neon === 'on' && `
        border: 2px solid white !important;
        ${props.colorScheme.primary === '--neonBlue' && `
            background-image: linear-gradient(to left bottom, #1b0257, #10125d, #041e61, #002764, #003065, #003667, #003c69, #00416a, #00476e, #004c71, #005275, #025778);
            color: var(--neonPink) !important;
            text-shadow: 1.5px 1.5px 3px var(--clearneonBlue);
            box-shadow: 0px 0px 10px 2px var(--neonPink), inset 0px 0px 10px 2px var(--neonPink);
        `};
        ${props.colorScheme.primary === '--neonPink' && `
            background-image: radial-gradient(at 75.40223998441866% 36.02924950095097%, hsla(274.6153846153846, 100%, 10.196078431372548%, 1) 0%, hsla(274.6153846153846, 100%, 10.196078431372548%, 0) 100%), radial-gradient(at 18.403454839479227% 55.161321090157344%, hsla(270, 49.99999999999999%, 40%, 1) 0%, hsla(270, 49.99999999999999%, 40%, 0) 100%), radial-gradient(at 48.58774233812395% 16.43729172351076%, hsla(274.6153846153846, 100%, 10.196078431372548%, 1) 0%, hsla(274.6153846153846, 100%, 10.196078431372548%, 0) 100%), radial-gradient(at 83.43911517801746% 90.87036381400861%, hsla(274.6153846153846, 100%, 25.49019607843137%, 1) 0%, hsla(274.6153846153846, 100%, 25.49019607843137%, 0) 100%), radial-gradient(at 89.1151892818652% 71.2998892086037%, hsla(274.6153846153846, 100%, 10.196078431372548%, 1) 0%, hsla(274.6153846153846, 100%, 10.196078431372548%, 0) 100%), radial-gradient(at 82.86386703122312% 26.46653016969487%, hsla(270, 49.99999999999999%, 40%, 1) 0%, hsla(270, 49.99999999999999%, 40%, 0) 100%), radial-gradient(at 30.824236324833443% 70.83481317919072%, hsla(274.6153846153846, 100%, 10.196078431372548%, 1) 0%, hsla(274.6153846153846, 100%, 10.196078431372548%, 0) 100%), radial-gradient(at 49.97782409234499% 5.710329066247244%, hsla(274.6153846153846, 100%, 25.49019607843137%, 1) 0%, hsla(274.6153846153846, 100%, 25.49019607843137%, 0) 100%), radial-gradient(at 50.46059425429681% 8.382195761391454%, hsla(274.6153846153846, 100%, 10.196078431372548%, 1) 0%, hsla(274.6153846153846, 100%, 10.196078431372548%, 0) 100%), radial-gradient(at 61.85731396887395% 30.642190549888394%, hsla(270, 49.99999999999999%, 40%, 1) 0%, hsla(270, 49.99999999999999%, 40%, 0) 100%), radial-gradient(at 44.751561551284304% 40.92828518748446%, hsla(274.6153846153846, 100%, 10.196078431372548%, 1) 0%, hsla(274.6153846153846, 100%, 10.196078431372548%, 0) 100%);
            color: var(--neonYellow) !important;
            text-shadow: 1.5px 1.5px 3px var(--clearneonBlue);
            box-shadow: 0px 0px 10px 2px var(--neonYellow), inset 0px 0px 10px 2px var(--neonYellow);
        `};
        ${props.colorScheme.primary === '--neonGreen' && `
            background-image: linear-gradient(to right top, #00992c, #039526, #05901f, #078c18, #08880f, #078713, #078717, #07861a, #078926, #088b31, #0a8e3a, #0e9043);
            color: var(--clearneonGreen) !important;
            text-shadow: 1.5px 1.5px 3px var(--neonRed);
            box-shadow: 0px 0px 10px 2px var(--neonRed), inset 0px 0px 10px 2px var(--neonRed);
            border: 2px solid var(--deepneonRed) !important;
        `};
        ${props.colorScheme.primary === '--neonRed' && `
            background-image: linear-gradient(to left bottom, #ae3000, #a72a04, #9f2308, #981d0b, #90170d, #8f1610, #8f1513, #8e1416, #94181b, #991b1f, #9f1f24, #a42229);
            color: var(--clearneonRed) !important;
            text-shadow: 1.5px 1.5px 3px var(--deepneonGreen);
            box-shadow: 0px 0px 10px 2px var(--neonGreen), inset 0px 0px 10px 2px var(--neonGreen);
        `};
        ${props.colorScheme.primary === '--neonYellow' && `
            background-image: radial-gradient(at 13.494393160826412% 49.14881520995156%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%), radial-gradient(at 90.89134521436331% 51.06148798398233%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 1) 0%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 0) 100%), radial-gradient(at 66.66993575639606% 34.59940862840265%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%), radial-gradient(at 45.8935237253224% 61.16258034457389%, hsla(46.86131386861314, 100%, 26.862745098039216%, 1) 0%, hsla(46.86131386861314, 100%, 26.862745098039216%, 0) 100%), radial-gradient(at 27.777738892016004% 97.43304176026544%, hsla(44.347826086956516, 100%, 18.03921568627451%, 1) 0%, hsla(44.347826086956516, 100%, 18.03921568627451%, 0) 100%), radial-gradient(at 48.47021279220951% 49.65594599965279%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%), radial-gradient(at 73.4344498033466% 97.43642927278384%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 1) 0%, hsla(46.9811320754717, 91.37931034482759%, 45.490196078431374%, 0) 100%), radial-gradient(at 28.52630191215524% 94.63323560333579%, hsla(40.705882352941174, 100%, 50%, 1) 0%, hsla(40.705882352941174, 100%, 50%, 0) 100%), radial-gradient(at 22.283326535927994% 80.20209210787954%, hsla(46.86131386861314, 100%, 26.862745098039216%, 1) 0%, hsla(46.86131386861314, 100%, 26.862745098039216%, 0) 100%);
            color: var(--black) !important;
            text-shadow: 1.5px 1.5px 3px var(--clearneonViolet);
            box-shadow: 0px 0px 10px 2px var(--clearneonViolet), inset 0px 0px 10px 2px var(--clearneonViolet);
            border: 2px solid var(--deepneonViolet) !important;
        `};
        ${props.colorScheme.primary === '--neonViolet' && `
            background-image: linear-gradient(to right top, #43025e, #40015d, #3d015c, #39005a, #360059, #37045a, #38085c, #390d5d, #3e1662, #441e66, #49266b, #4e2d6f);
            color: var(--whitesmoke) !important;
            text-shadow: 0px 0px 3px var(--clearneonYellow);
            box-shadow: 0px 0px 10px 2px var(--clearneonViolet), inset 0px 0px 10px 2px var(--clearneonViolet);
            border: 2px solid white !important;
        `};
        transition: all 0.3s ease-in-out;
    `}

    @media (max-width: 768px) {
        font-size: 25px;
    }

    @media (max-width: 480px) {
        top: -22px;
        padding: 8px;
        font-size: 18px;
    }
`;

const DivInfos = styled.div<StyleProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 2rem;
    padding-top: 2rem;
    position: relative;

    &.divTop{
        border-top: 2px solid var(${props => props.colorScheme.primaryClear});
    }
    &.divBottom{
        margin-top: 2rem;
        border-top: 2px solid var(${props => props.colorScheme.secondaryClear});
    }

    ${props => props.theme === 'light' && `
        padding-top: 3rem;
        &.divTop{
            border-top: 2px solid var(${props.colorScheme.secondaryDeep});
        }
        &.divBottom{
            margin-top: 3rem;
            border-top: 2px solid var(${props.colorScheme.secondaryDeep});
        }
        @media (max-width: 480px) {
            padding-top: 2rem;
        }
    `}

    transition: all 0.3s ease-in-out;
`;

const Subtitle = styled.h3<StyleProps>`
    position: absolute;
    top: -16px;
    padding: 0px 5px;
    font-size: 25px;
    background-color: var(--lightBlack);
    text-transform: uppercase;
    z-index: 2;

    &.subtitleTop{
        color: var(${props => props.colorScheme.primaryClear});
        text-shadow: 1.5px 1.5px 3px var(${props => props.colorScheme.secondaryClear});
    };
    &.subtitleBottom{
        color: var(${props => props.colorScheme.secondaryClear});
        text-shadow: 1.5px 1.5px 3px var(${props => props.colorScheme.primaryClear});
    };

    @media (max-width: 768px) {
        top: -12px;
        font-size: 20px;
    }

    @media (max-width: 480px) {
        top: -10px;
        font-size: 16px;
    }

    ${props => props.neon === 'on' && `
        background-color: var(--black);
        transition: all 0.3s ease-in-out;
    `}

    ${props => props.theme === 'light' && `
        top: 0px;
        background-color: transparent;
        color: var(${props.colorScheme.secondaryDeep}) !important;
        text-shadow: 1.5px 1.5px 5px transparent !important;
        transition: all 0.3s ease-in-out;

        @media (max-width: 480px) {
            top: 0;
        }
    `}

    ${props => props.theme === 'light' && props.neon === 'on' && `
        ${props.colorScheme.primary === '--neonBlue' && `
            color: var(--clearneonPink) !important;
        `};
        ${props.colorScheme.primary === '--neonPink' && `
            color: var(--clearneonYellow) !important;
        `};
        ${props.colorScheme.primary === '--neonGreen' && `
            color: var(--deepneonRed) !important;
        `};
        ${props.colorScheme.primary === '--neonRed' && `
            color: var(--clearneonRed) !important;
        `};
        ${props.colorScheme.primary === '--neonYellow' && `
            color: var(--deepneonViolet) !important;
        `};
        ${props.colorScheme.primary === '--neonViolet' && `
            color: var(--clearneonYellow) !important;
        `};
        transition: all 0.3s ease-in-out;

        @media (max-width: 480px) {
            top: 0;
        }
    `}

    transition: all 0.3s ease-in-out;
`;

const InfoControl = styled.div<StyleProps>`
    display: flex;
    flex-direction: row;
    gap: 2rem;
    height: 500px;
    transition: all 0.3s ease-in-out;
    

    @media (max-width: 1200px) {
        height: 450px;
    }

    @media (max-width: 1000px) {
        height: 400px;
    }

    @media (max-width: 768px) {
        gap: 1rem;
        height: 350px;
    }

    @media (max-width: 480px) {
        gap: 8px;
        height: 300px;
    }

    @media (max-width: 390px) {
        height: 260px;
    }
`;

const InfoCard = styled.div<StyleProps>`
    display: flex;
    height: 100%;
    flex-direction: column;
    align-items: center;
    border-radius: 10px;
    background-color: var(--black);

    ${props => props.neon === 'on' && `
        background-color: rgba(0, 0, 0, 0.3);
        border: 1px solid white;
        &.infoTop{
            box-shadow: 0px 0px 10px var(${props.colorScheme.primaryClear}), inset 0px 0px 10px var(${props.colorScheme.primaryClear});
        }
        &.infoBottom{
            box-shadow: 0px 0px 10px var(${props.colorScheme.secondaryClear}), inset 0px 0px 10px var(${props.colorScheme.secondaryClear});
        }
        transition: all 0.3s ease-in-out;
    `}

    ${props => props.theme === 'light' && `
        background-color: rgba(50, 50, 50, 0.5);
        border: 2px solid var(--black);
        transition: all 0.3s ease-in-out;
    `}

    ${props => props.theme === 'light' && props.neon === 'on' && `
        ${props.colorScheme.primary === '--neonBlue' && `
            &.infoTop{
                border-color: var(${props.colorScheme.primaryClear}) !important;
            }
            &.infoBottom{
                border-color: var(${props.colorScheme.secondaryClear}) !important;
            }
        `};
        ${props.colorScheme.primary === '--neonPink' && `
            &.infoTop{
                border-color: var(${props.colorScheme.primaryClear}) !important;
            }
            &.infoBottom{
                border-color: var(${props.colorScheme.secondaryClear}) !important;
            }
        `};
        ${props.colorScheme.primary === '--neonGreen' && `
            &.infoTop{
                border-color: var(${props.colorScheme.primaryClear}) !important;
            }
            &.infoBottom{
                border-color: var(${props.colorScheme.secondaryDeep}) !important;
            }
        `};
        ${props.colorScheme.primary === '--neonRed' && `
            &.infoTop{
                border-color: var(${props.colorScheme.primaryClear}) !important;
            }
            &.infoBottom{
                border-color: var(${props.colorScheme.secondaryClear}) !important;
            }
        `};
        ${props.colorScheme.primary === '--neonYellow' && `
            &.infoTop{
                border-color: var(${props.colorScheme.primaryClear}) !important;
            }
            &.infoBottom{
                border-color: var(${props.colorScheme.secondaryClear}) !important;
            }
        `};
        ${props.colorScheme.primary === '--neonViolet' && `
            &.infoTop{
                border-color: var(${props.colorScheme.primaryClear}) !important;
            }
            &.infoBottom{
                border-color: var(${props.colorScheme.secondaryClear}) !important;
            }
        `};

        transition: all 0.3s ease-in-out;
    `}
`;

const CardHeader = styled.div<StyleProps>`
    width: 100%;
    height: 55%;
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
    overflow: hidden;
    border-top-right-radius: 10px;
    border-top-left-radius: 10px;
    padding: 15px 15px 0;
    border: 2px solid transparent;
    ${props => props.type === 'city' && `
        &.headerTop{
            &:hover{
                box-shadow: 0px 0px 10px var(${props.colorScheme.primaryClear});
                border: 2px solid var(${props.colorScheme.primaryClear});
            }
        }
        &.headerBottom{
            &:hover{
                box-shadow: 0px 0px 10px var(${props.colorScheme.secondaryClear});
                border: 2px solid var(${props.colorScheme.secondaryClear});
            }
        }
    `};

    @media (max-width: 1200px) {
        height: 50%;
        padding: 5px 5px 0;
    }

    @media (max-width: 1000px) {
        height: 35%;
    }

    @media (max-width: 768px) {
    }

    @media (max-width: 480px) {
        height: 28%;
    }

    transition: all 0.3s ease-in-out;
`;

const CardImage = styled.img<StyleProps>`
    cursor: pointer;
    ${props => props.type === 'simple' ? `
        height: 100%;
        margin-right: 3rem;
        border-radius: 50%;
        border: 2px solid transparent;
        &.imageTop{
            &:hover{
                box-shadow: 0px 0px 10px var(${props.colorScheme.primaryClear});
                border: 2px solid var(${props.colorScheme.primaryClear});
            };
        };
        &.imageBottom{
            &:hover{
                box-shadow: 0px 0px 10px var(${props.colorScheme.secondaryClear});
                border: 2px solid var(${props.colorScheme.secondaryClear});
            };
        };

        @media (max-width: 1200px) {
        }

        @media (max-width: 1000px) {
        }

        @media (max-width: 768px) {
            height: auto;
            width: 40%;
        }

        @media (max-width: 480px) {
        }
    ` : `
        width: 100%;  
        position: absolute;
        left: 0;
        border-top-right-radius: 10px;
        border-top-left-radius: 10px;
        &:hover{
            transform: scale(1.1);
        };
        @media (max-width: 1250px) {
            top: 0;
        };
        @media (max-width: 768px) {
            top: -5px;
        };
    `};
    transition: all 0.3s ease;
`;

const CardName = styled.div<StyleProps>`
    ${props => props.type === 'simple' ? `
        font-size: 40px;
        font-weight: 100;
        font-family: 'DO Futuristic', sans-serif;  
        &.nameTop{
            color: var(${props.colorScheme.primaryClear});
            text-shadow: 1.5px 1.5px 5px var(${props.colorScheme.secondaryClear});
        }
        &.nameBottom{
            color: var(${props.colorScheme.secondaryClear});
            text-shadow: 1.5px 1.5px 5px var(${props.colorScheme.primaryClear});
        }

        ${props.colorScheme.primary === '--neonViolet' && `
            &.nameTop{
                color: var(${props.colorScheme.primaryDeep}) !important;
                text-shadow: 1px 1px 4px var(${props.colorScheme.secondary});
            }
            ${props.colorScheme.primary === '--neonViolet' && `
                &.nameTop{
                    color: var(${props.colorScheme.primaryClear}) !important;
                    text-shadow: 1px 1px 3px var(${props.colorScheme.secondary});
                };
            `};
        `};
        
        ${props.theme === 'light' && props.neon === 'on' && `
            ${props.colorScheme.primary === '--neonViolet' && `
                &.nameTop{
                    color: var(${props.colorScheme.primaryDeep}) !important;
                    text-shadow: 1.5px 1.5px 4px var(${props.colorScheme.secondary});
                }
                &.nameBottom{
                    color: var(${props.colorScheme.secondaryClear}) !important;
                }
            `};
            transition: all 0.3s ease-in-out;
        `};
        @media (max-width: 1200px) {
            margin-left: -30px;
        }

        @media (max-width: 1000px) {
            font-size: 30px;
        }

        @media (max-width: 768px) {
            font-size: 25px;
        }

        @media (max-width: 480px) {
            margin-left: -40px;
            font-size: 20px;
        }
    ` : `
        font-size: 40px;
        font-weight: 100;
        font-family: 'DO Futuristic', sans-serif;
        position: absolute;
        z-index: 1; 
        top: 0;
        left: 0;
        width: 100%;
        padding: 5px 8px;
        background: linear-gradient(90deg, rgba(23,23,23,0.9) 10%, rgba(77,238,234,0) 90%);
        &.nameTop{
            color: var(${props.colorScheme.primaryClear}); 
            text-shadow: 1px 1px 5px var(${props.colorScheme.secondaryClear});
        }
        &.nameBottom{
            color: var(${props.colorScheme.secondaryClear}); 
            text-shadow: 1px 1px 5px var(${props.colorScheme.primaryClear});
        }

        @media (max-width: 1250px) {
            font-size: 35px;
            background: linear-gradient(90deg, rgba(23,23,23,0.9) 10%, rgba(77,238,234,0) 70%);
        }

        @media (max-width: 1000px) {
            background: linear-gradient(90deg, rgba(23,23,23,0.9) 10%, rgba(77,238,234,0) 60%);
            font-size: 30px;
        }

        @media (max-width: 768px) {
            background: linear-gradient(90deg, rgba(23,23,23,0.9) 10%, rgba(77,238,234,0) 50%);
            font-size: 25px;
        }

        @media (max-width: 480px) {
            font-size: 20px;
        }
    `}
`;

const CardDescription = styled.div`
    padding: 15px;
    height: 38%;
    font-size: 20px;

    @media (max-width: 1200px) {
        padding: 5px 8px;
        height: 43%;
        font-size: 18px;
    }

    @media (max-width: 1000px) {
        height: 58%;
        font-size: 14px;
    }

    @media (max-width: 480px) {
        margin: 5px 0px 2px;
        padding: 0px 5px;
        height: 65%;
        font-size: 11px;
    }
`;

const CardLink = styled.div<StyleProps>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 7%;
    font-size: 18px;
    padding-bottom: 15px;
    .linkTop{
        color: var(${props => props.colorScheme.primaryClear});
        position: relative;
        padding-bottom: 1px;
        &::after{
            content: " ";
            width: 0%;
            height: 2px;
            bottom: 0;
            left: 0;
            border-radius: 10px;
            position: absolute;
            background-color: var(${props => props.colorScheme.primaryClear});
            box-shadow: 0 0 5px var(${props => props.colorScheme.primaryClear});
            transition: all 350ms ease;
        }
        &:hover::after{
            width: 100%;
            transition: all 350ms ease;
        }
    }
    .linkBottom {
        color: var(${props => props.colorScheme.secondaryClear});
        position: relative;
        padding-bottom: 1px;
        &::after{
            content: " ";
            width: 0%;
            height: 2px;
            bottom: 0;
            left: 0;
            border-radius: 10px;
            position: absolute;
            background-color: var(${props => props.colorScheme.secondaryClear});
            box-shadow: 0 0 5px var(${props => props.colorScheme.secondaryClear});
            transition: all 350ms ease;
        }
        &:hover::after{
            width: 100%;
            transition: all 350ms ease;
        }
    }

    ${props => props.theme === 'light' && `
        ${props.colorScheme.primary === '--neonViolet' && `
            .linkTop{
                color: var(${props.colorScheme.primaryClear}) !important;
                text-shadow: 0px 0px 5px var(--black);
            }
        `};
        transition: all 0.3s ease-in-out;
    `}

    @media (max-width: 768px) {
        font-size: 15px;
    }

    @media (max-width: 480px) {
        font-weight: bold;
        font-size: 12px;
    }
    transition: all 0.3s ease-in-out;
`;

const CarouselOptions = styled.div`
    position: absolute;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: calc(100% + 35px);
    pointer-events: none;

    @media (max-width: 768px) {
        width: calc(100% + 20px);
    }

    @media (max-width: 480px) {
        width: calc(100% + 15px);
    }
`;

const CarouselButton = styled.button<StyleProps>`
    pointer-events: auto;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    font-size: 35px;
    border-radius: 50%;
    border: none;
    background-color: rgba(35, 35, 35, 0.5);

    .icon{
        fill: var(--grey);
    }

    &:hover{
        background-color: var(--black);
        transform: scale(1.2);
        &.buttonTop{
            .icon{
                fill: var(${props => props.colorScheme.primaryClear});
            }
        }
            &.buttonBottom{
            .icon{
                fill: var(${props => props.colorScheme.secondaryClear});
            }
        }
    }

    @media (max-width: 768px) {
        font-size: 25px;
    }

    @media (max-width: 480px) {
        font-size: 18px;
    }

    transition: all 0.3s ease-in-out;
`;

export { ContainerWiki, Title, DivInfos, Subtitle, InfoControl, InfoCard, CardHeader, CardImage, CardName, CardDescription, CardLink, CarouselOptions, CarouselButton };