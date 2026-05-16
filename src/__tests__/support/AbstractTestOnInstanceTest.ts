import AbstractModuleTest from '../../utilities/AbstractModuleTest.js'

export default abstract class AbstractTestOnInstanceTest extends AbstractModuleTest {
    public static beforeAllCount = 0
    public static beforeEachCount = 0
    public static afterEachCount = 0

    public static beforeBeforeAllCount = 0
    public static beforeBeforeAllCount2 = 0
    public static afterBeforeAllCount = 0
    public static afterBeforeAllCount2 = 0

    public static beforeBeforeEach = 0
    public static beforeBeforeEach2 = 0

    public static afterBeforeEach = 0
    public static afterBeforeEach2 = 0

    public static beforeAfterEach = 0
    public static beforeAfterEach2 = 0

    public static afterAfterEach = 0
    public static afterAfterEach2 = 0

    public static beforeAfterAll = 0
    public static beforeAfterAll2 = 0

    public static afterAfterAll = 0
    public static afterAfterAll2 = 0
}
