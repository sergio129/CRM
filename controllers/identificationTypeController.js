exports.getIdentificationTypes = (req, res) => {
    const types = [
        { value: "DNI", label: "DNI" },
        { value: "Pasaporte", label: "Pasaporte" },
        { value: "Cédula", label: "Cédula" },
        { value: "Otro", label: "Otro" }
    ];

    res.json(types);
};
