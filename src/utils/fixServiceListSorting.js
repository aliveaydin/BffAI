const fixServiceListSorting = (serviceList) => {

    serviceList.forEach((service,index)=>{
        service.priority = index+1;
    });

    const priority = {
        'auth': 0,
        'notification': 98,
        'bff': 99,
    };

    serviceList.sort((a, b) => {
        const aPriority = priority[a.name] ?? a.priority;
        const bPriority = priority[b.name] ?? b.priority;

        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }

        return a.name.localeCompare(b.name);
    });

    return serviceList;
};

module.exports = fixServiceListSorting;
