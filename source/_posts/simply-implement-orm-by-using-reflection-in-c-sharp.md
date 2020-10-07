---
title: 在C#中用反射简易实现ORM
date: 2020-10-07 11:30:08
---

学习了一些面向对象的语言之后，总会想要实现一些高层次的抽象。这篇文章用反射实现了insert SQL的命令，简易实现了ORM。

# 数据库
作为示例，先新建一个company database，再新建一个包含name、age、telephone、address四列的employees table。
```SQL
CREATE DATABASE company;
USE company;

CREATE TABLE employees (
    id INT NOT NULL,
    Name VARCHAR(20) NOT NULL,
    Age INT NOT NULL,
    Telephone VARCHAR(20) NOT NULL,
    Address VARCHAR(40) NOT NULL,
    PRIMARY KEY (id)
);
```

创建好以后的结构如下：
```SQL
SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| company            |
|                    |
| <...>              |
+--------------------+

USE company;
SHOW TABLES;
+-------------------+
| Tables_in_company |
+-------------------+
| employees         |
+-------------------+

+----+---------------+-----+-------------+-----------+
| id | Name          | Age | Telephone   | Address   |
+----+---------------+-----+-------------+-----------+
```

# model
新建一个model文件夹。按照上面创建的数据库，在model下创建一个employee类。
```csharp
namespace <ProjectName>.Model
{
    public class Employee
    {

        // set getter for GetProperties()
        public string Name { get; }
        public int Age { get; }
        public string Telephone { get; }
        public string Address { get; }

        public Employee(string name, int age,
            string telephone, string address)
        {
            Name = name;
            Age = age;
            Telephone = telephone;
            Address = address;
        }

    }
}
```

注意，设定`getter`对于`GetProperties()`来说是必要的。

# 数据库连接
新建Dao文件夹，在Dao下新建一个使用[单例模式][1]的CompanyDb类，用于连接到数据库。
```csharp
namespace <ProjectName>.Dao
{
    public sealed class CompanyDb
    {

        public static MySqlConnection Connection { get { return Nested.Connection; } }

        private CompanyDb() { }

        private class Nested
        {
            static Nested() { }

            internal static readonly MySqlConnection Connection = new
                MySqlConnection($"server = localhost; User ID = " +
                $"{<username>}; Password = {<Password>}; DataBase = " +
                "company; Charset = utf8; convert zero datetime = true");
        }

    }
}
```

# 操作数据表
## 分解
在Dao下新建EmployeeHandler，并创建一个接收`Model.Employee`对象的Add函数
```csharp
namespace <ProjectName>.Dao
{
    public class EmployeeHandler
    {

        static public int Add(Model.Employee model)
        {
            // Code will goes here
        }

    }
}
```

首先，将model的[属性名与属性值映射为字典][2]。
```csharp
// Put property names and property values of model as pairs into dictionary
Dictionary<string, object> propertyDict = model.GetType().GetProperties()
    .ToDictionary
    (
        propInfo => propInfo.Name,
        // Add quote to avoid user input breaks SQL command
        propInfo => $"'{propInfo.GetValue(model, null)}'"
    );
```

结合Dictionary.Keys和Dictionary.Values分别[获取它们的键的列表与值的列表][3]，再使用`string.Join()`构造SQL命令语句。
```csharp
// Build a SQL command by traversing properties of model
// For example: "INSERT INTO table (column1, column2) VALUES ('value1', 'value2');"
string sqlCmd = $"INSERT INTO employees (" +
    $"{string.Join(", ", propertyDict.Keys)}) VALUES " +
    $"({string.Join(", ", propertyDict.Values)});";
```

剩下就是没什么好讲的执行过程了。
```csharp
MySqlCommand cmd  = new MySqlCommand(sqlCmd, CompanyDb.connection);
cmd.Connection.Open();
int resultCode = cmd.ExecuteNonQuery();
cmd.Connection.Close();
return resultCode;
```

## 总览
```csharp
namespace <ProjectName>.Dao
{
    public class EmployeeHandler
    {

        static public int Add(Model.Employee model)
        {
            // Put property names and property values of model as pairs into dictionary
            Dictionary<string, object> propertyDict = model.GetType().GetProperties()
                .ToDictionary
                (
                    propInfo => propInfo.Name,
                    // Add quote to avoid user input breaks SQL command
                    propInfo => $"'{propInfo.GetValue(model, null)}'"
                );
                
            // Build a SQL command by traversing properties of model
            // For example: "INSERT INTO table (column1, column2) VALUES ('value1', 'value2');"
            string sqlCmd = $"INSERT INTO employees (" +
                $"{string.Join(", ", propertyDict.Keys)}) VALUES " +
                $"({string.Join(", ", propertyDict.Values)});";

            MySqlCommand cmd  = new MySqlCommand(sqlCmd, CompanyDb.connection);
            cmd.Connection.Open();
            int resultCode = cmd.ExecuteNonQuery();
            cmd.Connection.Close();
            return resultCode;
        }

    }
}
```

# 使用
```csharp
EmployeeHandler.Add(new Model.Employee(name, age, telephone, address));
```


[1]: <https://csharpindepth.com/articles/singleton> "单例模式"
[2]: <https://stackoverflow.com/questions/4943817/mapping-object-to-dictionary-and-vice-versa/4944547#4944547> "属性名与属性值映射为字典"
[3]: <https://docs.microsoft.com/en-us/dotnet/api/system.collections.generic.dictionary-2?view=netcore-3.1#examples> "获取它们的键的列表与值的列表"
