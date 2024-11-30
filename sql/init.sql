CREATE TABLE IF NOT EXISTS Tasks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    description VARCHAR(200),
    startDate DATE,
    endDate DATE
);

CREATE TABLE IF NOT EXISTS TaskDetails (
    id SERIAL PRIMARY KEY,
    assignedPerson VARCHAR(100),
    taskId INT,
    FOREIGN KEY (taskId) REFERENCES Tasks(id)
);

INSERT INTO tasks (name, description, startDate, endDate) VALUES
('Create table', 'Create tables User, Details', '2020-12-12', '2020-12-18'),
('Create docker', 'Create docker file', '2020-12-14', '2020-12-18');

INSERT INTO taskdetails (assignedPerson, taskId) VALUES
('Maksym M', 1),
('Ivan P', 2);
