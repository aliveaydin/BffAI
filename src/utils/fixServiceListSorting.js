const servicePriorities = require('../config/servicePriorities.json');

const fixServiceListSorting = (serviceList) => {

    serviceList.forEach((service,index)=>{
        service.priority = index+1;
    });

    serviceList.sort((a, b) => {
        const aPriority = servicePriorities[a.name] ?? a.priority;
        const bPriority = servicePriorities[b.name] ?? b.priority;

        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }

        return a.name.localeCompare(b.name);
    });

    return serviceList;
};

module.exports = fixServiceListSorting;
